import { SERIES_STORAGE_NAME, SERIES_STORE_VERSION } from '@/constants';
import { ToggleAllWatchedMode } from '@/enums';
import { FavoritesSeries, Series, TrackingSeriesData } from '@/types';
import { Nullable } from '@/utility-types';
import {
  createTrackingSeriesData,
  fetchSeriesMetadata,
  getISODateNow,
  migrateSeriesState,
  updateTrackingSeriesData,
} from '@/utils';
import { chromeStorage } from '@/utils/storage.utils';
import { SeriesTombstones } from '@/zod-schemas';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

enum SeriesActionTypes {
  InitLoading = 'initLoading',
  InitSuccess = 'initSuccess',
  InitError = 'initError',
  InitFinally = 'initFinally',
  ClearErrorState = 'clearErrorState',
  ToggleWatched = 'toggleWatched',
  ToggleAllWatched = 'toggleAllWatched',
  SetIsRewardShown = 'setIsRewardShown',
  Remove = 'remove',
  SetActiveSeriesId = 'setActiveSeriesId',
  ToggleFavorites = 'toggleFavorites',
  RefreshLoading = 'refreshLoading',
  RefreshSuccess = 'refreshSuccess',
  RefreshError = 'refreshError',
  RefreshFinally = 'refreshFinally',
}

interface ToggleEpisodeWatchedData {
  seriesId: string;
  seasonId: string;
  episodeId: string;
  isWatched: boolean;
}

type SeriesStore = {
  activeSeriesId: Nullable<number>;
  seriesData: Nullable<Series[]>;
  trackingSeriesMap: Record<string, boolean>;
  isRewardShownMap: Record<string, boolean>;
  favoritesSeriesMap: Record<string, FavoritesSeries>;
  trackingSeriesData: Nullable<TrackingSeriesData>;
  // Soft-delete markers for series that the user removed. Synced via Drive
  // so deletions propagate across devices. See docs/sync-merge-strategy.md.
  seriesTombstones: SeriesTombstones;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Nullable<string>;
};

type SeriesActions = {
  fetchSeries: (id: number, signal?: AbortSignal) => void;
  refreshSeries: (id: number, signal?: AbortSignal) => void;
  clearErrorState: () => void;
  removeSeries: (seriesId: number) => void;
  toggleEpisodeWatched: (data: ToggleEpisodeWatchedData) => void;
  toggleAllWatched: (seriesId: number, seasonId: number, mode: ToggleAllWatchedMode) => void;
  setIsRewardShown: (seriesId: number) => void;
  setActiveSeriesId: (seriesId: number) => void;
  toggleFavorites: (seriesId: number) => void;
};

const initialState: SeriesStore = {
  activeSeriesId: null,
  seriesData: null,
  trackingSeriesMap: {},
  isRewardShownMap: {},
  favoritesSeriesMap: {},
  trackingSeriesData: {},
  seriesTombstones: {},
  isLoading: false,
  isRefreshing: false,
  error: null,
} as const;

export const useSeriesStore = create<SeriesStore & SeriesActions>()(
  devtools(
    immer(
      persist(
        set => ({
          ...initialState,
          fetchSeries: (id, signal) => {
            set(
              draft => {
                draft.isLoading = true;
              },
              false,
              SeriesActionTypes.InitLoading,
            );

            fetchSeriesMetadata({
              id,
              signal,
              delay: 0,
              onSuccess(newSeries) {
                set(
                  draft => {
                    draft.seriesData = draft.seriesData ? [...draft.seriesData, newSeries] : [newSeries];
                    draft.trackingSeriesMap[newSeries.id] = true;

                    if (!draft.trackingSeriesData) {
                      draft.trackingSeriesData = {};
                    }

                    draft.trackingSeriesData[newSeries.id] = createTrackingSeriesData(newSeries);

                    // Re-adding a previously deleted series clears its tombstone
                    // so the deletion doesn't propagate back from another device.
                    delete draft.seriesTombstones[String(newSeries.id)];
                  },
                  false,
                  SeriesActionTypes.InitSuccess,
                );
              },
              onError(errorMessage) {
                set(
                  draft => {
                    draft.error = errorMessage;
                  },
                  false,
                  SeriesActionTypes.InitError,
                );
              },
              onFinally() {
                set(
                  draft => {
                    draft.isLoading = false;
                  },
                  false,
                  SeriesActionTypes.InitFinally,
                );
              },
            });
          },
          refreshSeries: (id, signal) => {
            set(
              draft => {
                draft.isRefreshing = true;
              },
              false,
              SeriesActionTypes.RefreshLoading,
            );

            fetchSeriesMetadata({
              id,
              signal,
              delay: 1700,
              onSuccess(updatedSeries) {
                set(
                  draft => {
                    if (!draft.seriesData?.length || !draft.trackingSeriesData) return;

                    const seriesIndex = draft.seriesData?.findIndex(series => series.id === updatedSeries.id);

                    if (seriesIndex > -1) {
                      draft.seriesData[seriesIndex] = updatedSeries;
                    }

                    draft.trackingSeriesData[id] = updateTrackingSeriesData(
                      draft.trackingSeriesData[id],
                      updatedSeries,
                    );
                  },
                  false,
                  SeriesActionTypes.RefreshSuccess,
                );
              },
              onError(errorMessage) {
                set(
                  draft => {
                    draft.error = errorMessage;
                  },
                  false,
                  SeriesActionTypes.RefreshError,
                );
              },
              onFinally() {
                set(
                  draft => {
                    draft.isRefreshing = false;
                  },
                  false,
                  SeriesActionTypes.RefreshFinally,
                );
              },
            });
          },

          removeSeries: seriesId => {
            set(
              draft => {
                if (!draft.seriesData || !draft.trackingSeriesData) return;

                const seriesIdIndex = draft.seriesData.findIndex(storedSeries => storedSeries.id === seriesId);

                if (seriesIdIndex > -1) {
                  draft.seriesData.splice(seriesIdIndex, 1);
                }
                delete draft.trackingSeriesData[seriesId];
                delete draft.trackingSeriesMap[seriesId];
                delete draft.isRewardShownMap[seriesId];
                delete draft.favoritesSeriesMap[seriesId];

                // Tombstone the removal so the next sync propagates it to other devices.
                // Merge logic uses this to distinguish "intentionally deleted" from
                // "never tracked here". See docs/sync-merge-strategy.md.
                draft.seriesTombstones[String(seriesId)] = { deletedAt: getISODateNow() };

                draft.activeSeriesId = draft.seriesData.length > 0 ? draft.seriesData[0].id : null;
              },
              false,
              SeriesActionTypes.Remove,
            );
          },
          setActiveSeriesId: (id: number) => {
            set(
              draft => {
                draft.activeSeriesId = id;
              },
              false,
              SeriesActionTypes.SetActiveSeriesId,
            );
          },
          clearErrorState: () =>
            set(
              draft => {
                draft.error = null;
              },
              false,
              SeriesActionTypes.ClearErrorState,
            ),
          toggleEpisodeWatched: ({ seriesId, seasonId, episodeId, isWatched }) => {
            set(
              draft => {
                const series = draft.trackingSeriesData?.[seriesId];
                const season = series?.seasons?.[seasonId];
                const episode = season?.episodes[episodeId];

                if (!episode) return;

                episode.isWatched = isWatched;
                episode.timestamp = isWatched ? getISODateNow() : null;
              },
              false,
              SeriesActionTypes.ToggleWatched,
            );
          },
          toggleAllWatched: (seriesId, seasonId, mode) => {
            set(
              draft => {
                const series = draft.trackingSeriesData?.[seriesId];
                const season = series?.seasons?.[seasonId];

                if (!season) return;

                Object.values(season.episodes).forEach(episode => {
                  switch (mode) {
                    case ToggleAllWatchedMode.Complete: {
                      if (episode.isWatched) return;

                      episode.isWatched = true;
                      episode.timestamp = getISODateNow();
                      return;
                    }

                    case ToggleAllWatchedMode.Reset: {
                      episode.isWatched = false;
                      episode.timestamp = null;
                      return;
                    }
                  }
                });
              },
              false,
              `${SeriesActionTypes.ToggleAllWatched}/mode:${mode}`,
            );
          },
          toggleFavorites: (seriesId: number) => {
            set(
              draft => {
                const entry = draft.favoritesSeriesMap[seriesId];

                if (entry) {
                  entry.isFavorite = !entry.isFavorite;
                  entry.timestamp = getISODateNow();
                } else {
                  draft.favoritesSeriesMap[seriesId] = {
                    isFavorite: true,
                    timestamp: getISODateNow(),
                  };
                }
              },
              false,
              `${SeriesActionTypes.ToggleFavorites}:${seriesId}`,
            );
          },

          setIsRewardShown: seriesId => {
            set(
              draft => {
                draft.isRewardShownMap[seriesId] = true;
              },
              false,
              `${SeriesActionTypes.SetIsRewardShown}/seriesId`,
            );
          },
        }),
        {
          name: SERIES_STORAGE_NAME,
          storage: createJSONStorage(() => chromeStorage),
          version: SERIES_STORE_VERSION,
          partialize: state => ({
            seriesData: state.seriesData,
            activeSeriesId: state.activeSeriesId,
            trackingSeriesMap: state.trackingSeriesMap,
            favoritesSeriesMap: state.favoritesSeriesMap,
            trackingSeriesData: state.trackingSeriesData,
            isRewardShownMap: state.isRewardShownMap,
            seriesTombstones: state.seriesTombstones,
          }),
          migrate: migrateSeriesState,
        },
      ),
    ),
    { name: 'Store', store: 'series' },
  ),
);
