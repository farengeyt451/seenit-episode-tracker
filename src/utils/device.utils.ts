import { DEVICE_ID_STORAGE_NAME } from '@/constants';
import { Nullable } from '@/utility-types';
import { chromeStorage } from '@/utils/storage.utils';

let cachedDeviceId: Nullable<string> = null;
let inflight: Nullable<Promise<string>> = null;

const generateDeviceId = (): string => {
  return crypto.randomUUID();
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;
  if (inflight) return inflight; // return same read storage promise in case several fn call

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
