// Stable per-install device identifier used by Drive sync as `lastWriter`.
//
// The id is purely diagnostic — the merge algorithm never reads it. It exists
// so Settings can show "Last written by this device" / "Last written by
// another device" and so support requests can be triaged by writer identity.
//
// Storage: chrome.storage.local (or localStorage in web dev) under a stable
// key. The id is created lazily on first read and reused forever after.

import { DEVICE_ID_STORAGE_NAME } from '@/constants';
import { chromeStorage } from '@/utils/storage.utils';

// Cached in-memory so concurrent callers in the same tick share the same id
// (and only one chromeStorage round-trip is paid for the lifetime of the page).
let cachedDeviceId: string | null = null;
let inflight: Promise<string> | null = null;

const generateDeviceId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (very old browsers).
  // Sixteen bytes of randomness rendered as hex — same entropy as a UUID v4.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;
  if (inflight) return inflight;

  inflight = (async () => {
    const existing = await chromeStorage.getItem(DEVICE_ID_STORAGE_NAME);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
    const id = generateDeviceId();
    await chromeStorage.setItem(DEVICE_ID_STORAGE_NAME, id);
    cachedDeviceId = id;
    return id;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
};
