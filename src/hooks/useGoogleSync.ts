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

  useEffect(() => {
    if (hasReconnected.current) return;
    hasReconnected.current = true;
    tryReconnect();
  }, [tryReconnect]);

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
