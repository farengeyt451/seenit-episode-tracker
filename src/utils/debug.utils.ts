// Owner-only diagnostic globals.
//
// This module's import is a side effect — it registers `window.seenitDebug`
// at load time so the helpers are callable from any browser console (dev or
// prod, web or extension popup) without importing modules.
//
// Start with `window.seenitDebug.help()` to discover the available commands.
//
// Add new helpers by:
//   1. Defining the function below.
//   2. Adding it to the SeenitDebug interface.
//   3. Adding a row in `help()`.
//   4. Wiring it into the window assignment at the bottom.
//
// Safety note: every helper here ships in the production bundle. Anyone who
// finds the global can call them. Only expose operations that read or affect
// the caller's own data — never anything that could leak or modify another
// user's data.

import { SERIES_STORAGE_NAME } from '@/constants';
import { useSyncStore } from '@/store';
import { getOrCreateDeviceId } from '@/utils/device.utils';
import { getGoogleToken } from '@/utils/google-auth.utils';
import { readDriveFile } from '@/utils/google-drive.utils';
import { mergeStates } from '@/utils/merge-snapshots.utils';
import { chromeStorage } from '@/utils/storage.utils';
import { DriveSnapshotSchema, PersistedSeriesStore, PersistedSeriesStoreSchema } from '@/zod-schemas';

// ─── Private helpers ──────────────────────────────────────────────────────────

// Guard for Drive-dependent commands. Throws a friendly error so the console
// shows something useful instead of a generic null reference.
const assertConnected = (): { fileId: string } => {
  const { isConnected, fileId } = useSyncStore.getState();
  if (!isConnected || !fileId) {
    throw new Error('Cloud sync is not connected. Connect Google Drive in Settings first.');
  }
  return { fileId };
};

// Read the currently-persisted series state from chromeStorage, validated by
// Zod. Returns null on a fresh install or if the stored blob is unparseable.
const readPersistedLocalState = async (): Promise<PersistedSeriesStore | null> => {
  const raw = await chromeStorage.getItem(SERIES_STORAGE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const check = PersistedSeriesStoreSchema.safeParse(parsed.state);
    return check.success ? check.data : null;
  } catch {
    return null;
  }
};

// ─── Helper implementations ──────────────────────────────────────────────────

// Downloads and parses the current Drive snapshot for the connected account.
// Useful for inspecting what the merge engine actually sees on a given device.
const getCloudData = async (): Promise<unknown> => {
  const { fileId } = assertConnected();
  const token = await getGoogleToken(false);
  const cloudData = await readDriveFile(token, fileId);

  console.log('Seenit Cloud Data 📺', cloudData);

  return cloudData;
};

// Dumps the persisted local series state — the same shape that lives in the
// Drive snapshot's `state` field. Mirror of getCloudData() for local data.
const getLocalData = async (): Promise<PersistedSeriesStore | null> => readPersistedLocalState();

// Snapshot of the sync store excluding actions. Quick "where are we?" view:
// connection state, last sync time, current phase, last error.
interface SyncMetaSnapshot {
  status: string;
  phase: string;
  isConnected: boolean;
  fileId: string | null;
  lastSyncedAt: string | null;
  lastSeenModifiedTime: string | null;
  error: string | null;
}

const getSyncMeta = (): SyncMetaSnapshot => {
  const { status, phase, isConnected, fileId, lastSyncedAt, lastSeenModifiedTime, error } = useSyncStore.getState();

  return { status, phase, isConnected, fileId, lastSyncedAt, lastSeenModifiedTime, error };
};

// Stable per-install UUID. The same value embedded as `lastWriter` in every
// Drive snapshot this device pushes — useful for "did I write this, or did
// another device?" investigations.
const getDeviceId = (): Promise<string> => getOrCreateDeviceId();

// Preview the merge without committing it. Pulls Drive, parses local, runs
// mergeStates() in memory, returns all three states plus a `changed` flag
// (true when the merge result differs from the current local state, i.e.
// applying it would actually update something).
interface DryRunMergeResult {
  local: PersistedSeriesStore | null;
  cloud: PersistedSeriesStore | null;
  merged: PersistedSeriesStore | null;
  changed: boolean;
}

const dryRunMerge = async (): Promise<DryRunMergeResult> => {
  const { fileId } = assertConnected();
  const token = await getGoogleToken(false);

  const cloudRaw = await readDriveFile(token, fileId);
  const cloudParsed = DriveSnapshotSchema.safeParse(cloudRaw);
  const cloud = cloudParsed.success ? cloudParsed.data.state : null;

  const local = await readPersistedLocalState();

  let merged: PersistedSeriesStore | null;
  if (local && cloud) {
    merged = mergeStates(local, cloud);
  } else {
    merged = cloud ?? local;
  }

  const changed = JSON.stringify(merged) !== JSON.stringify(local);
  return { local, cloud, merged, changed };
};

// Prints the available commands as a table. Single source of truth — keep
// in sync with the SeenitDebug interface and the window assignment below.
const help = (): void => {
  console.table([
    { cmd: 'help()', returns: 'void', purpose: 'this table' },
    { cmd: 'getSyncMeta()', returns: 'SyncMetaSnapshot', purpose: 'current connection / status / phase' },
    { cmd: 'getDeviceId()', returns: 'Promise<string>', purpose: 'stable per-install UUID (lastWriter)' },
    { cmd: 'getLocalData()', returns: 'Promise<state | null>', purpose: 'dump persisted local series state' },
    { cmd: 'getCloudData()', returns: 'Promise<DriveSnapshot>', purpose: 'download the Drive snapshot' },
    {
      cmd: 'dryRunMerge()',
      returns: 'Promise<{local,cloud,merged,changed}>',
      purpose: 'preview mergeStates() result without writing',
    },
  ]);
};

// ─── Public surface ───────────────────────────────────────────────────────────

interface SeenitDebug {
  help: () => void;
  getSyncMeta: () => SyncMetaSnapshot;
  getDeviceId: () => Promise<string>;
  getLocalData: () => Promise<PersistedSeriesStore | null>;
  getCloudData: () => Promise<unknown>;
  dryRunMerge: () => Promise<DryRunMergeResult>;
}

declare global {
  interface Window {
    seenitDebug?: SeenitDebug;
  }
}

if (typeof window !== 'undefined') {
  window.seenitDebug = {
    help,
    getSyncMeta,
    getDeviceId,
    getLocalData,
    getCloudData,
    dryRunMerge,
  };
}
