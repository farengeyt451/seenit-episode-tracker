// useSyncStore — central orchestrator for Google Drive sync.
//
// Public actions:
//   connect      — user clicks "Connect Google Drive" in Settings (interactive auth)
//   disconnect   — user clicks "Disconnect"
//   syncNow      — manual "Sync now" or debounced auto-sync
//   tryReconnect — called silently on app startup; runs a full sync cycle
//
// All three "do work" actions (connect, syncNow, tryReconnect-rehydrate path)
// funnel through the same internal `runSyncCycle` routine, which does a
// pull → merge → push roundtrip. This is the key change that makes the system
// eventually consistent across multiple devices.
//
// I/O is delegated:
//   - google-auth.utils  — OAuth tokens
//   - google-drive.utils — Drive REST API
//   - merge-snapshots    — pure CRDT-style merge with tombstone support
//
// See docs/sync-merge-strategy.md for the algorithm and use-case matrix.

import { DRIVE_FILE_NAME, SERIES_STORAGE_NAME, SYNC_META_STORAGE_NAME } from '@/constants';
import { SyncPhase, SyncStatus } from '@/enums';
import { Nullable } from '@/utility-types';
import { getOrCreateDeviceId } from '@/utils';
import { getGoogleToken, revokeGoogleToken } from '@/utils/google-auth.utils';
import {
  createDriveFile,
  findDriveFile,
  getDriveFileMeta,
  readDriveFile,
  updateDriveFile,
} from '@/utils/google-drive.utils';
import { mergeStates } from '@/utils/merge-snapshots.utils';
import { chromeStorage } from '@/utils/storage.utils';
import {
  CURRENT_DRIVE_SCHEMA_VERSION,
  DriveSnapshot,
  DriveSnapshotSchema,
  PersistedSeriesStore,
  PersistedSeriesStoreSchema,
} from '@/zod-schemas';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useSeriesStore } from './useSeriesStore';

// ─── Types ────────────────────────────────────────────────────────────────────
enum SyncActionTypes {
  ConnectSyncing = 'connectSyncing',
  ConnectSuccess = 'connectSuccess',
  ConnectError = 'connectError',
  Disconnect = 'disconnect',
  SyncNowSyncing = 'syncNowSyncing',
  SyncNowSuccess = 'syncNowSuccess',
  SyncNowError = 'syncNowError',
  TryReconnectSuccess = 'tryReconnectSuccess',
  TryReconnectError = 'tryReconnectError',
  ClearError = 'clearError',
}

interface SyncState {
  status: SyncStatus;
  // Direction of the current in-flight Drive I/O. Pulling while fetching the
  // cloud snapshot, Pushing while writing the merged result back. Used by the
  // header cloud button to swap between cloud-arrow-down and cloud-arrow-up.
  phase: SyncPhase;
  isConnected: boolean;
  lastSyncedAt: Nullable<string>;
  // Drive file's modifiedTime after our most recent successful push (or pull
  // on connect). Used to detect "did another device write since we last saw
  // this file?" — when true, the sync cycle pulls the body before pushing.
  lastSeenModifiedTime: Nullable<string>;
  error: Nullable<string>;
  fileId: Nullable<string>;
}

interface SyncActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncNow: () => Promise<void>;
  tryReconnect: () => Promise<void>;
  clearError: () => void;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

interface LocalSnapshot {
  state: PersistedSeriesStore;
  version: number;
}

// Read the currently-persisted series state from storage. Returns null when
// storage is empty (fresh install) so callers can short-circuit.
const readLocalSnapshot = async (): Promise<LocalSnapshot | null> => {
  const raw = await chromeStorage.getItem(SERIES_STORAGE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const stateCheck = PersistedSeriesStoreSchema.safeParse(parsed.state);
    if (!stateCheck.success) return null;
    return { state: stateCheck.data, version: typeof parsed.version === 'number' ? parsed.version : 1 };
  } catch {
    return null;
  }
};

// Write a merged state back to local storage and rehydrate the Zustand store
// so the UI updates immediately. Used when the merge produced something
// different from what was on disk.
const writeLocalSnapshot = async (state: PersistedSeriesStore, version: number): Promise<void> => {
  const payload = JSON.stringify({ state, version });
  await chromeStorage.setItem(SERIES_STORAGE_NAME, payload);
  await useSeriesStore.persist.rehydrate();
};

// Empty state used when the user has nothing yet — Drive still gets a
// placeholder file so subsequent auto-syncs have something to PATCH.
const emptyPersistedState = (): PersistedSeriesStore => ({
  seriesData: null,
  activeSeriesId: null,
  trackingSeriesMap: {},
  favoritesSeriesMap: {},
  trackingSeriesData: null,
  isRewardShownMap: {},
  seriesTombstones: {},
});

// Build a Drive-ready snapshot from a state object. Stamps schemaVersion,
// syncedAt and lastWriter so other devices can attribute the write.
const buildDriveSnapshot = (state: PersistedSeriesStore, version: number, deviceId: string): DriveSnapshot => ({
  schemaVersion: CURRENT_DRIVE_SCHEMA_VERSION,
  version,
  state,
  syncedAt: new Date().toISOString(),
  lastWriter: deviceId,
});

// Cheap structural equality for "did the merge change anything?" — used to
// skip a no-op writeLocalSnapshot + rehydrate cycle.
const sameSnapshot = (a: PersistedSeriesStore, b: PersistedSeriesStore): boolean => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

// Artificial delay so each sync phase stays on screen long enough to see the
// pulling / pushing animations. Drive I/O is usually faster than the human
// eye can register a transition; this pads each phase to ~1 s so the cloud
// button conveys progress meaningfully.
const SYNC_PHASE_MIN_MS = 1000;
const phaseDelay = (): Promise<void> => new Promise(resolve => setTimeout(resolve, SYNC_PHASE_MIN_MS));

// ─── Sync cycle ───────────────────────────────────────────────────────────────
//
// Single routine driving every sync action. Returns the new sync metadata so
// the caller can update its UI state in one set() call.
//
//   1. Resolve / discover the Drive file id.
//   2. Peek at Drive metadata (cheap). If modifiedTime ≠ lastSeenModifiedTime
//      OR `forceFullPull` is true (used by connect), download the body.
//   3. Parse the cloud snapshot. If schema valid, merge with local; else
//      local wins (cloud is treated as corrupted and gets overwritten).
//   4. If the merge changed local state, write it back and rehydrate.
//   5. Push the (possibly merged) state to Drive.
//   6. Return updated SyncMeta to the caller.

interface SyncCycleResult {
  fileId: string;
  lastSyncedAt: string;
  lastSeenModifiedTime: string;
}

interface SyncCycleOptions {
  token: string;
  fileId: Nullable<string>;
  lastSeenModifiedTime: Nullable<string>;
  // When true, always pull the body even if modifiedTime matches. Used by
  // connect() so the very first sync after auth reconciles everything.
  forceFullPull: boolean;
  // Optional hook fired whenever the cycle transitions between Pulling and
  // Pushing. Lets the store update its `phase` field so the UI can swap
  // between cloud-arrow-down and cloud-arrow-up icons during the cycle.
  onPhase?: (phase: SyncPhase) => void;
}

const runSyncCycle = async ({
  token,
  fileId,
  lastSeenModifiedTime,
  forceFullPull,
  onPhase,
}: SyncCycleOptions): Promise<SyncCycleResult> => {
  const deviceId = await getOrCreateDeviceId();

  // ── Step 1: resolve fileId + obtain current modifiedTime ──────────────────
  // findDriveFile already returns modifiedTime, so we can skip the explicit
  // getDriveFileMeta call when this is the first sync after auth.
  onPhase?.(SyncPhase.Pulling);
  await phaseDelay();
  let resolvedFileId = fileId;
  let remoteModifiedTime: string;
  if (!resolvedFileId) {
    const found = await findDriveFile(token, DRIVE_FILE_NAME);
    if (found) {
      resolvedFileId = found.id;
      remoteModifiedTime = found.modifiedTime;
    } else {
      // First-ever connect on this Drive account: create the file from local
      // state (or an empty placeholder if storage is empty) and we're done.
      // This is a pure push — flip phase so the icon reflects it.
      onPhase?.(SyncPhase.Pushing);
      await phaseDelay();
      const local = await readLocalSnapshot();
      const state = local?.state ?? emptyPersistedState();
      const version = local?.version ?? 1;
      const snapshot = buildDriveSnapshot(state, version, deviceId);
      const meta = await createDriveFile(token, DRIVE_FILE_NAME, snapshot);
      return {
        fileId: meta.id,
        lastSyncedAt: snapshot.syncedAt,
        lastSeenModifiedTime: meta.modifiedTime,
      };
    }
  } else {
    // We already had a fileId — issue a cheap metadata-only fetch to see if
    // any other device has written since our last sync.
    const remoteMeta = await getDriveFileMeta(token, resolvedFileId);
    remoteModifiedTime = remoteMeta.modifiedTime;
  }

  // ── Step 2: decide whether to pull the body ──────────────────────────────
  // If nothing changed remotely and we're not forcing a full pull, we can
  // skip the body download entirely and just push our local state.
  const remoteChanged = forceFullPull || remoteModifiedTime !== lastSeenModifiedTime;

  // ── Step 3: read local + (conditionally) cloud, then merge ────────────────
  const local = await readLocalSnapshot();
  const localState = local?.state ?? emptyPersistedState();
  const localVersion = local?.version ?? 1;

  let mergedState: PersistedSeriesStore = localState;
  let mergedVersion = localVersion;

  if (remoteChanged) {
    let cloudParsed: DriveSnapshot | null = null;
    try {
      const cloudRaw = await readDriveFile(token, resolvedFileId);
      const parsed = DriveSnapshotSchema.safeParse(cloudRaw);
      if (parsed.success) cloudParsed = parsed.data;
    } catch {
      // Body unreadable (transient network blip / corrupted bytes). Treat as
      // "no cloud" — local will win and overwrite on the push below.
    }

    if (cloudParsed) {
      mergedState = mergeStates(localState, cloudParsed.state);
      mergedVersion = Math.max(localVersion, cloudParsed.version);
    }
  }

  // ── Step 4: write back if the merge produced something new ────────────────
  if (!sameSnapshot(mergedState, localState) || mergedVersion !== localVersion) {
    await writeLocalSnapshot(mergedState, mergedVersion);
  }

  // ── Step 5: push the merged state to Drive ────────────────────────────────
  onPhase?.(SyncPhase.Pushing);
  await phaseDelay();
  const snapshot = buildDriveSnapshot(mergedState, mergedVersion, deviceId);
  const pushed = await updateDriveFile(token, resolvedFileId, snapshot);

  return {
    fileId: resolvedFileId,
    lastSyncedAt: snapshot.syncedAt,
    lastSeenModifiedTime: pushed.modifiedTime,
  };
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSyncStore = create<SyncState & SyncActions>()(
  devtools(
    immer(
      persist(
        (set, get) => ({
          status: SyncStatus.Idle,
          phase: SyncPhase.Idle,
          isConnected: false,
          lastSyncedAt: null,
          lastSeenModifiedTime: null,
          error: null,
          fileId: null,

          // ════════════════════════════════════════════════════════════════════
          // connect — interactive OAuth + first sync cycle
          //
          // The full sync cycle is delegated to runSyncCycle with
          // forceFullPull=true so we always download and merge the existing
          // cloud snapshot on the first connect (even if modifiedTime happens
          // to match a stale lastSeenModifiedTime from a previous session).
          // ════════════════════════════════════════════════════════════════════
          connect: async () => {
            set(
              { status: SyncStatus.Syncing, phase: SyncPhase.Pulling, error: null },
              false,
              SyncActionTypes.ConnectSyncing,
            );
            try {
              const token = await getGoogleToken(true);
              const result = await runSyncCycle({
                token,
                fileId: get().fileId,
                lastSeenModifiedTime: get().lastSeenModifiedTime,
                forceFullPull: true,
                onPhase: phase => set({ phase }),
              });

              set(
                {
                  isConnected: true,
                  fileId: result.fileId,
                  status: SyncStatus.Success,
                  phase: SyncPhase.Idle,
                  lastSyncedAt: result.lastSyncedAt,
                  lastSeenModifiedTime: result.lastSeenModifiedTime,
                  error: null,
                },
                false,
                SyncActionTypes.ConnectSuccess,
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Could not connect to Google. Please try again.';
              set(
                { status: SyncStatus.Error, phase: SyncPhase.Idle, error: message, isConnected: false },
                false,
                SyncActionTypes.ConnectError,
              );
            }
          },

          // ════════════════════════════════════════════════════════════════════
          // disconnect — revoke token + clear connection state
          //
          // Local Seenit data is untouched. Reconnecting later will reconcile
          // with whatever is on Drive at that point via the standard sync cycle.
          // ════════════════════════════════════════════════════════════════════
          disconnect: async () => {
            try {
              const token = await getGoogleToken(false);
              await revokeGoogleToken(token);
            } catch {
              // Best-effort: even if revocation fails (expired token, offline)
              // we still clear local connection state.
            }

            set(
              {
                isConnected: false,
                fileId: null,
                status: SyncStatus.Idle,
                phase: SyncPhase.Idle,
                lastSyncedAt: null,
                lastSeenModifiedTime: null,
                error: null,
              },
              false,
              SyncActionTypes.Disconnect,
            );
          },

          // ════════════════════════════════════════════════════════════════════
          // syncNow — manual Sync button OR debounced auto-sync
          //
          // Uses the same pull→merge→push routine as connect, but with
          // forceFullPull=false. When Drive's modifiedTime matches our cached
          // lastSeenModifiedTime, no body fetch happens; we push directly.
          // ════════════════════════════════════════════════════════════════════
          syncNow: async () => {
            const { isConnected, fileId, lastSeenModifiedTime } = get();
            if (!isConnected) return;

            set(
              { status: SyncStatus.Syncing, phase: SyncPhase.Pulling, error: null },
              false,
              SyncActionTypes.SyncNowSyncing,
            );
            try {
              const token = await getGoogleToken(false);
              const result = await runSyncCycle({
                token,
                fileId,
                lastSeenModifiedTime,
                forceFullPull: false,
                onPhase: phase => set({ phase }),
              });

              set(
                {
                  status: SyncStatus.Success,
                  phase: SyncPhase.Idle,
                  lastSyncedAt: result.lastSyncedAt,
                  lastSeenModifiedTime: result.lastSeenModifiedTime,
                  fileId: result.fileId,
                  error: null,
                },
                false,
                SyncActionTypes.SyncNowSuccess,
              );
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Sync failed. Will retry on next change.';
              set(
                { status: SyncStatus.Error, phase: SyncPhase.Idle, error: message },
                false,
                SyncActionTypes.SyncNowError,
              );
            }
          },

          // ════════════════════════════════════════════════════════════════════
          // tryReconnect — silent startup restore + initial sync
          //
          // 1. Rehydrate persisted sync meta (skipHydration=true means this is
          //    the only time hydration runs).
          // 2. If not connected → nothing to do.
          // 3. Try a non-interactive token; if it succeeds, run a full sync
          //    cycle immediately so the popup always opens with fresh Drive
          //    data (another device may have written since the last session).
          // ════════════════════════════════════════════════════════════════════
          tryReconnect: async () => {
            await useSyncStore.persist.rehydrate();

            const { isConnected, fileId } = get();
            if (!isConnected || !fileId) return;

            try {
              await getGoogleToken(false);
              set(
                { status: SyncStatus.Idle, phase: SyncPhase.Idle, error: null },
                false,
                SyncActionTypes.TryReconnectSuccess,
              );
              // Run a full pull→merge→push cycle on every popup open so the
              // user always sees the latest state from Drive without having to
              // click "Sync now" manually.
              await get().syncNow();
            } catch {
              set(
                {
                  isConnected: false,
                  fileId: null,
                  lastSyncedAt: null,
                  lastSeenModifiedTime: null,
                  status: SyncStatus.Idle,
                  phase: SyncPhase.Idle,
                  error: null,
                },
                false,
                SyncActionTypes.TryReconnectError,
              );
            }
          },

          // ════════════════════════════════════════════════════════════════════
          // clearError — drop a failed-connect error so the UI resets to its
          // idle state (e.g. the settings dialog reopening shows "Connect"
          // again instead of "Reconnect"). No-op unless currently in Error so we
          // never interrupt an in-flight sync.
          // ════════════════════════════════════════════════════════════════════
          clearError: () => {
            if (get().status !== SyncStatus.Error) return;

            set({ status: SyncStatus.Idle, error: null }, false, SyncActionTypes.ClearError);
          },
        }),
        {
          name: SYNC_META_STORAGE_NAME,
          storage: createJSONStorage(() => chromeStorage),
          // v2 adds lastSeenModifiedTime so the sync cycle can detect remote
          // writes without re-downloading the body on every cycle.
          version: 2,
          partialize: state => ({
            isConnected: state.isConnected,
            fileId: state.fileId,
            lastSyncedAt: state.lastSyncedAt,
            lastSeenModifiedTime: state.lastSeenModifiedTime,
          }),
          // Backfill lastSeenModifiedTime for users upgrading from v1. A null
          // here just forces a full pull on the next sync cycle — safe.
          migrate: persisted => {
            const obj = (persisted ?? {}) as Partial<SyncState>;
            if (!('lastSeenModifiedTime' in obj)) {
              obj.lastSeenModifiedTime = null;
            }
            return obj as SyncState & SyncActions;
          },
          // Defer hydration until tryReconnect so the UI never briefly shows
          // isConnected=true before the OAuth token has been verified.
          skipHydration: true,
        },
      ),
    ),
    { name: 'Store', store: 'sync' },
  ),
);
