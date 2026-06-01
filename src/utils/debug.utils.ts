import { SERIES_STORAGE_NAME } from '@/constants';
import { useSyncStore } from '@/store';
import { getOrCreateDeviceId } from '@/utils/device.utils';
import { getGoogleToken } from '@/utils/google-auth.utils';
import { readDriveFile } from '@/utils/google-drive.utils';
import { mergeStates } from '@/utils/merge-snapshots.utils';
import { chromeStorage } from '@/utils/storage.utils';
import { DriveSnapshotSchema, PersistedSeriesStore, PersistedSeriesStoreSchema } from '@/zod-schemas';

interface SyncMetaSnapshot {
  status: string;
  phase: string;
  isConnected: boolean;
  fileId: string | null;
  lastSyncedAt: string | null;
  lastSeenModifiedTime: string | null;
  error: string | null;
}

interface DryRunMergeResult {
  local: PersistedSeriesStore | null;
  cloud: PersistedSeriesStore | null;
  merged: PersistedSeriesStore | null;
  changed: boolean;
}

interface SeenitDebug {
  help: () => void;
  getSyncMeta: () => void;
  getDeviceId: () => Promise<void>;
  getLocalData: () => Promise<void>;
  getCloudData: () => Promise<void>;
  dryRunMerge: () => Promise<void>;
}

declare global {
  interface Window {
    seenitDebug?: SeenitDebug;
  }
}

// Throw unless cloud sync is connected; returns the Drive fileId.
const assertConnected = (): { fileId: string } => {
  const { isConnected, fileId } = useSyncStore.getState();
  if (!isConnected || !fileId) {
    throw new Error('Cloud sync is not connected. Connect Google Drive in Settings first.');
  }
  return { fileId };
};

// Read the persisted local series state; null on fresh install or unparseable data.
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

// Current connection / status / phase / last error.
const getSyncMeta = (): void => {
  const { status, phase, isConnected, fileId, lastSyncedAt, lastSeenModifiedTime, error } = useSyncStore.getState();
  const meta: SyncMetaSnapshot = { status, phase, isConnected, fileId, lastSyncedAt, lastSeenModifiedTime, error };

  console.log('📺', 'Seenit Sync Meta', meta);
};

// Stable per-install UUID (embedded as `lastWriter` in every Drive snapshot).
const getDeviceId = async (): Promise<void> => {
  const deviceId = await getOrCreateDeviceId();

  console.log('📺', 'Seenit Device ID', deviceId);
};

// Dump the persisted local series state.
const getLocalData = async (): Promise<void> => {
  const localData = await readPersistedLocalState();

  console.log('📺', 'Seenit Local Data', localData);
};

// Download the current Drive snapshot.
const getCloudData = async (): Promise<void> => {
  const { fileId } = assertConnected();
  const token = await getGoogleToken(false);
  const cloudData = await readDriveFile(token, fileId);

  console.log('📺', 'Seenit Cloud Data', cloudData);
};

// Preview mergeStates() without writing; `changed` flags a real update.
const dryRunMerge = async (): Promise<void> => {
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
  const result: DryRunMergeResult = { local, cloud, merged, changed };

  console.log('📺', 'Seenit Dry Run Merge', result);
};

// Print available commands. Keep in sync with SeenitDebug.
const help = (): void => {
  console.table([
    { cmd: 'help()', logs: 'this table', purpose: 'list available commands' },
    { cmd: 'getSyncMeta()', logs: 'SyncMetaSnapshot', purpose: 'current connection / status / phase' },
    { cmd: 'getDeviceId()', logs: 'string', purpose: 'stable per-install UUID (lastWriter)' },
    { cmd: 'getLocalData()', logs: 'state | null', purpose: 'dump persisted local series state' },
    { cmd: 'getCloudData()', logs: 'DriveSnapshot', purpose: 'download the Drive snapshot' },
    {
      cmd: 'dryRunMerge()',
      logs: '{local,cloud,merged,changed}',
      purpose: 'preview mergeStates() result without writing',
    },
  ]);
};

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
