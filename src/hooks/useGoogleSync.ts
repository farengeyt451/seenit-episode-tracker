// useGoogleSync — mounts Drive sync at the app level (EpisodesTracker).
//
// It does two things:
//   1. Silent reconnect on startup  — restores the previous Drive session
//      without the user clicking "Connect" again.
//   2. Debounced auto-sync whenever the series store changes,
//      wait SYNC_DEBOUNCE_MS ms then push the new state to Drive.
//
// The hook has no return value. UI state (connected, last synced, errors)
// is read directly from useSyncStore by the Settings dialog.

import { SYNC_DEBOUNCE_MS } from '@/constants';
import { useSeriesStore } from '@/store/useSeriesStore';
import { useSyncStore } from '@/store/useSyncStore';
import { useEffect, useRef } from 'react';

export const useGoogleSync = (): void => {
  const isConnected = useSyncStore(state => state.isConnected);
  const syncNow = useSyncStore(state => state.syncNow);
  const tryReconnect = useSyncStore(state => state.tryReconnect);

  // Ensure tryReconnect runs only once per app mount, not on every render.
  const hasReconnected = useRef(false);

  // ── Effect 1: silent reconnect ─────────────────────────────────────────────
  // Runs once after the component mounts. Checks chromeStorage for a saved
  // sync-meta entry and silently obtains a new OAuth token.
  // If the token is still valid, isConnected flips to true and Effect 2 starts.
  // If the token expired, the "Connect" button is shown in Settings instead.
  useEffect(() => {
    if (hasReconnected.current) return;
    hasReconnected.current = true;
    tryReconnect();
  }, [tryReconnect]);

  // ── Effect 2: debounced auto-sync ──────────────────────────────────────────
  // Only active when isConnected === true (re-evaluates whenever that changes).
  //
  // Step 1: Subscribe to any state change in useSeriesStore.
  //         Zustand's subscribe() fires synchronously after every set() call.
  //
  // Step 2: On each change, reset a debounce timer to SYNC_DEBOUNCE_MS (2 s).
  //         This prevents uploading to Drive on every individual episode click —
  //         if the user marks several episodes in quick succession, only one
  //         upload fires after they stop.
  //
  // Step 3: When the timer fires, call syncNow() which pushes the current
  //         Zustand-persisted state to Drive.
  //
  // Cleanup: unsubscribe from the store and cancel any pending timer when
  //          the component unmounts or isConnected becomes false.
  useEffect(() => {
    if (!isConnected) return;

    let debounceTimer: ReturnType<typeof setTimeout>;

    const unsubscribe = useSeriesStore.subscribe(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(syncNow, SYNC_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      clearTimeout(debounceTimer);
    };
  }, [isConnected, syncNow]);
};
