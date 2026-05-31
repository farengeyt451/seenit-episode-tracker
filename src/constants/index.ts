const API_HOST = import.meta.env.VITE_HOST;
const API_PROTOCOL = import.meta.env.VITE_PROTOCOL;

const BASE_SEARCH_API = {
  PROTOCOL: 'https',
  HOST: 'api.tvmaze.com',
} as const;

const BASE_LICENSE_API = {
  PROTOCOL: API_PROTOCOL,
  HOST: API_HOST,
  ACTIVATE_LICENSE: 'activate-license',
  CHECK_LICENSE: 'check-license',
} as const;

const BASE_SEARCH_URL = `${BASE_SEARCH_API.PROTOCOL}://${BASE_SEARCH_API.HOST}`;

const BASE_LICENSE_URL = `${BASE_LICENSE_API.PROTOCOL}://${BASE_LICENSE_API.HOST}`;

export const SEARCH_ENDPOINT = `${BASE_SEARCH_URL}/search/shows`;

export const SEASONS_ENDPOINT = `${BASE_SEARCH_URL}/shows/{id}?embed=seasons`;

export const DEFAULT_SEARCH_THROTTLE = 300;

export const SERIES_STORAGE_NAME = 'series-storage';

export const THEME_STORAGE_NAME = 'theme-storage';

export const LICENSE_STATUS_STORAGE_NAME = 'license-status-storage';

export const ACTIVATE_LICENSE = `${BASE_LICENSE_URL}/${BASE_LICENSE_API.ACTIVATE_LICENSE}`;

export const CHECK_LICENSE = `${BASE_LICENSE_URL}/${BASE_LICENSE_API.CHECK_LICENSE}`;

export const SYNC_META_STORAGE_NAME = 'sync-meta';

export const DRIVE_FILE_NAME = 'seenit-data.json';

export const SYNC_DEBOUNCE_MS = 2000;

// Tombstones older than this are dropped during merge. 60 days is well beyond
// any plausible offline-device window while keeping the table bounded.
export const TOMBSTONE_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

// Stable device UUID, generated once on first sync action and reused thereafter.
// Stored in chrome.storage so it survives extension restarts but is local-only
// (never written into the Drive snapshot's state, only used in `lastWriter`).
export const DEVICE_ID_STORAGE_NAME = 'seenit-device-id';

export const SYNC_PHASE_DELAY_MS = 1000;
