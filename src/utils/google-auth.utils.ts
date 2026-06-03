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

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

// Web-only: persist the token across page reloads within the same browser session
// sessionStorage is cleared when the tab is closed, so tokens never survive past
// the session without the user re-authorizing
const SESSION_TOKEN_KEY = 'seenit-gis-token';
const SESSION_TOKEN_EXPIRY_KEY = 'seenit-gis-token-expiry';

const isExtension = (): boolean => typeof chrome !== 'undefined' && !!chrome?.runtime?.id;

const IDENTITY_PERMISSION: chrome.permissions.Permissions = { permissions: ['identity'] };

// Whether the optional "identity" permission is currently granted.
export const hasIdentityPermission = (): Promise<boolean> => {
  if (!isExtension() || !chrome.permissions) return Promise.resolve(false);

  return new Promise<boolean>(resolve => {
    chrome.permissions.contains(IDENTITY_PERMISSION, granted => resolve(!!granted && !chrome.runtime.lastError));
  });
};

// Request the optional "identity" permission
const requestIdentityPermission = (): Promise<boolean> =>
  new Promise<boolean>(resolve => {
    chrome.permissions.request(IDENTITY_PERMISSION, granted => resolve(!!granted && !chrome.runtime.lastError));
  });

// Drop the optional "identity" permission so it stays dynamic — after the user
// disconnects Drive, the extension no longer holds identity access
export const removeIdentityPermission = (): Promise<void> =>
  new Promise<void>(resolve => {
    if (!isExtension() || !chrome.permissions) {
      resolve();
      return;
    }
    chrome.permissions.remove(IDENTITY_PERMISSION, () => resolve());
  });

// EXTENSION PATH — chrome.identity
// Chrome manages the OAuth flow automatically using the client_id declared in
// manifest.json under "oauth2". No popup is shown for non-interactive calls if
// the user has already granted consent
const getExtensionToken = async (interactive: boolean): Promise<string> => {
  // "identity" is optional, so make sure it's granted before touching the API.
  // For interactive calls we ask for it (user gesture); otherwise we require it
  // to already be present and fail fast so callers can reset to a disconnected
  // state without crashing on an undefined chrome.identity namespace.
  const granted = (await hasIdentityPermission()) || (interactive && (await requestIdentityPermission()));

  if (!granted || !chrome.identity) {
    throw new Error('Google Drive access was not granted.');
  }

  return new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message ?? 'Failed to get auth token'));
        return;
      }
      // Older @types/chrome returns string; newer returns GetAuthTokenResult object
      const token = typeof result === 'string' ? result : result?.token;
      if (!token) {
        reject(new Error('No auth token returned'));
        return;
      }
      resolve(token);
    });
  });
};

const revokeExtensionToken = (token: string): Promise<void> =>
  new Promise<void>(resolve => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }).catch(() => {});
      resolve();
    });
  });

// WEB PATH — Google Identity Services (GIS)
// Used during development (npm run dev) or when the app is opened as a web page
// GIS shows a Google popup for interactive auth and returns a short-lived access
// token (1 hour). We cache it in sessionStorage to avoid a popup on every reload
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

// Persist the new token so the next call within the session is silent
const storeWebToken = (token: string, expiresIn: number): void => {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_TOKEN_EXPIRY_KEY, String(Date.now() + (expiresIn - 60) * 1000));
  } catch (err) {
    console.error('Failed to store web token', err);
  }
};

const loadGisScript = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
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
  const stored = getStoredWebToken();
  if (stored) return stored;

  if (!interactive) {
    throw new Error('Session expired. Please reconnect Google Drive.');
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured.');
  }

  await loadGisScript();

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: response => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
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
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_EXPIRY_KEY);
  } catch (err) {
    console.error('Failed to revoke web token', err);
  }

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

export const getGoogleToken = (interactive: boolean): Promise<string> =>
  isExtension() ? getExtensionToken(interactive) : getWebToken(interactive);

export const revokeGoogleToken = (token: string): Promise<void> =>
  isExtension() ? revokeExtensionToken(token) : revokeWebToken(token);
