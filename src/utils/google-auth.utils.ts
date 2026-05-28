// ─── GIS type declarations ────────────────────────────────────────────────────
// Google Identity Services (GIS) is the web-only alternative to chrome.identity.
// We declare only the slice of the API we actually use.

interface GisTokenResponse {
  access_token: string;
  expires_in: number; // seconds until the token expires (typically 3600)
  error?: string;
  error_description?: string;
}

interface GisTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GisTokenResponse) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }) => GisTokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

// Web-only: persist the token across page reloads within the same browser session.
// sessionStorage is cleared when the tab is closed, so tokens never survive past
// the session without the user re-authorizing.
const SESSION_TOKEN_KEY = 'seenit-gis-token';
const SESSION_TOKEN_EXPIRY_KEY = 'seenit-gis-token-expiry';

// ─── Context detection ────────────────────────────────────────────────────────

// Returns true when running inside the Chrome extension (chrome.identity is available).
// Returns false when running as a plain web app (dev server, etc.).
const isExtension = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome?.identity;

// ════════════════════════════════════════════════════════════════════════════════
// EXTENSION PATH — chrome.identity
// Chrome manages the OAuth flow automatically using the client_id declared in
// manifest.json under "oauth2". No popup is shown for non-interactive calls if
// the user has already granted consent.
// ════════════════════════════════════════════════════════════════════════════════

const getExtensionToken = (interactive: boolean): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    // Step 1: Ask Chrome to return a cached token or (if interactive=true)
    //         open the Google OAuth consent screen in a new window.
    chrome.identity.getAuthToken({ interactive }, result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message ?? 'Failed to get auth token'));
        return;
      }
      // Older @types/chrome returns string; newer returns GetAuthTokenResult object.
      const token = typeof result === 'string' ? result : result?.token;
      if (!token) {
        reject(new Error('No auth token returned'));
        return;
      }
      resolve(token);
    });
  });

const revokeExtensionToken = (token: string): Promise<void> =>
  new Promise<void>(resolve => {
    // Step 1: Remove the token from Chrome's local cache.
    chrome.identity.removeCachedAuthToken({ token }, () => {
      // Step 2: Also revoke on Google's servers so it cannot be reused.
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }).catch(() => {});
      resolve();
    });
  });

// ════════════════════════════════════════════════════════════════════════════════
// WEB PATH — Google Identity Services (GIS)
// Used during development (npm run dev) or when the app is opened as a web page.
// GIS shows a Google popup for interactive auth and returns a short-lived access
// token (1 hour). We cache it in sessionStorage to avoid a popup on every reload.
// ════════════════════════════════════════════════════════════════════════════════

// Step helper: read a previously cached token from sessionStorage.
// Returns null if absent or expired (we subtract a 60 s safety buffer).
const getStoredWebToken = (): string | null => {
  try {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const expiry = sessionStorage.getItem(SESSION_TOKEN_EXPIRY_KEY);
    if (!token || !expiry || Date.now() > parseInt(expiry, 10)) {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_EXPIRY_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

// Step helper: persist the new token so the next call within the session is silent.
const storeWebToken = (token: string, expiresIn: number): void => {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_TOKEN_EXPIRY_KEY, String(Date.now() + (expiresIn - 60) * 1000));
  } catch {
    // sessionStorage may be blocked by the browser — token lives only for this call.
  }
};

// Step helper: inject the GIS <script> tag on first use (lazy-loaded).
// Resolves immediately if the library is already present.
const loadGisScript = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    // Avoid adding a second <script> if one is already being loaded.
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

const getWebToken = async (interactive: boolean): Promise<string> => {
  // Step 1: Return the cached sessionStorage token if it is still valid.
  //         This makes non-interactive calls instant after the first sign-in.
  const stored = getStoredWebToken();
  if (stored) return stored;

  // Step 2: Non-interactive path — no stored token and we cannot show a popup.
  //         Signal the caller (tryReconnect) that the user must re-connect manually.
  if (!interactive) {
    throw new Error('Session expired. Please reconnect Google Drive.');
  }

  // Step 3: Ensure VITE_GOOGLE_CLIENT_ID is set in .env.local / .env.production.
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured.');
  }

  // Step 4: Lazily load the GIS script if it hasn't been injected yet.
  await loadGisScript();

  // Step 5: Open the Google OAuth popup. GIS calls our callback with the result.
  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: response => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        // Step 6: Cache the token so subsequent calls within this session are silent.
        storeWebToken(response.access_token, response.expires_in);
        resolve(response.access_token);
      },
      error_callback: err => {
        reject(new Error(err.message ?? 'Google sign-in failed'));
      },
    });
    client.requestAccessToken();
  });
};

const revokeWebToken = (token: string): Promise<void> => {
  // Step 1: Clear the cached token so getStoredWebToken returns null from now on.
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_EXPIRY_KEY);
  } catch {
    // ignore
  }

  // Step 2: Revoke on Google's servers (best-effort).
  return new Promise<void>(resolve => {
    if (window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, resolve);
    } else {
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' })
        .catch(() => {})
        .finally(resolve);
    }
  });
};

// ─── Public API ───────────────────────────────────────────────────────────────
// Both functions pick the right path automatically at runtime.
// All other modules import only these two — they never call chrome.identity
// or GIS directly.

export const getGoogleToken = (interactive: boolean): Promise<string> =>
  isExtension() ? getExtensionToken(interactive) : getWebToken(interactive);

export const revokeGoogleToken = (token: string): Promise<void> =>
  isExtension() ? revokeExtensionToken(token) : revokeWebToken(token);
