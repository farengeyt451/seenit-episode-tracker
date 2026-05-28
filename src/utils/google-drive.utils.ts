// Thin wrapper around Drive REST API v3. No SDK dependency.
// Every request attaches the OAuth token as a Bearer header.
//
// All file operations target the user's hidden `appDataFolder` — invisible in
// Drive UI, accessible only to this app under the `drive.appdata` scope.

import { DriveSnapshot } from '@/zod-schemas';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

const authHeader = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

export interface DriveFileMeta {
  id: string;
  // RFC 3339 timestamp Drive updates on every successful write. Used by the
  // sync cycle to cheaply detect "did another device write since we last
  // pulled?" without re-downloading the body.
  modifiedTime: string;
}

// ─── findDriveFile ────────────────────────────────────────────────────────────
// Searches appDataFolder for our file by name. Returns the id + modifiedTime
// so the caller can also seed `lastSeenModifiedTime` after a fresh connect.
export const findDriveFile = async (token: string, fileName: string): Promise<DriveFileMeta | null> => {
  const query = encodeURIComponent(`name='${fileName}'`);
  const url = `${DRIVE_API_BASE}/files?spaces=appDataFolder&fields=files(id,modifiedTime)&q=${query}`;

  const response = await fetch(url, { headers: authHeader(token) });
  if (!response.ok) throw new Error(`Drive list failed (${response.status})`);

  const data = await response.json();
  const file = data.files?.[0];
  if (!file?.id || !file?.modifiedTime) return null;
  return { id: file.id as string, modifiedTime: file.modifiedTime as string };
};

// ─── getDriveFileMeta ────────────────────────────────────────────────────────
// Cheap metadata-only fetch (~1 KB response). Returns the file's current
// modifiedTime so the sync cycle can decide whether a body fetch is necessary.
export const getDriveFileMeta = async (token: string, fileId: string): Promise<DriveFileMeta> => {
  const url = `${DRIVE_API_BASE}/files/${fileId}?fields=id,modifiedTime`;
  const response = await fetch(url, { headers: authHeader(token) });
  if (!response.ok) throw new Error(`Drive meta failed (${response.status})`);

  const data = await response.json();
  return { id: data.id as string, modifiedTime: data.modifiedTime as string };
};

// ─── readDriveFile ────────────────────────────────────────────────────────────
// Downloads the file content as parsed JSON. The caller validates the shape
// with Zod before merging.
export const readDriveFile = async (token: string, fileId: string): Promise<unknown> => {
  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: authHeader(token),
  });
  if (!response.ok) throw new Error(`Drive read failed (${response.status})`);
  return response.json();
};

// ─── createDriveFile ─────────────────────────────────────────────────────────
// Creates a new file in appDataFolder. Returns the new id + modifiedTime so
// the sync store can immediately persist them without a follow-up call.
export const createDriveFile = async (
  token: string,
  fileName: string,
  data: DriveSnapshot,
): Promise<DriveFileMeta> => {
  const metadata = { name: fileName, parents: ['appDataFolder'] };

  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  body.append('media', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  // fields=id,modifiedTime asks Drive to return both on success so the caller
  // can seed lastSeenModifiedTime in one round-trip.
  const response = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,modifiedTime`, {
    method: 'POST',
    headers: authHeader(token),
    body,
  });
  if (!response.ok) throw new Error(`Drive create failed (${response.status})`);

  const result = await response.json();
  return { id: result.id as string, modifiedTime: result.modifiedTime as string };
};

// ─── updateDriveFile ─────────────────────────────────────────────────────────
// Overwrites the content of an existing file with a full snapshot. Returns
// the post-write modifiedTime so the caller can update lastSeenModifiedTime.
//
// We always do a full overwrite — no diffs or patches. The file id never
// changes so sync-meta stays valid for the lifetime of the connection.
export const updateDriveFile = async (
  token: string,
  fileId: string,
  data: DriveSnapshot,
): Promise<DriveFileMeta> => {
  const response = await fetch(
    `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,modifiedTime`,
    {
      method: 'PATCH',
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) throw new Error(`Drive update failed (${response.status})`);

  const result = await response.json();
  return { id: result.id as string, modifiedTime: result.modifiedTime as string };
};
