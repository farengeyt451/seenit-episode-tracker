import { EmptySeriesState, EpisodesGrid, Header, SeasonHeader, Sidebar } from '@/components';
import { SeriesHeader } from '@/components/series-header';
import { LinearProgress, SeenitDialog, SeenitDialogHandle, WelcomeTVIcon } from '@/components/ui';
import { SeriesStatus } from '@/enums';
import { useSeriesCompletionReward } from '@/hooks/useSeriesCompletionReward';
import { useFilterStore, useSearchStore, useSeriesStore } from '@/store';
import { TrackingSeason, TrackingSeries } from '@/types';
import { Nullable } from '@/utility-types';
import { Transition } from '@headlessui/react';
import clsx from 'clsx';
import { FC, JSX, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

interface SeasonDisplayData {
  seriesId: Nullable<number>;
  season: TrackingSeason;
  totalEpisodes: number;
  watchedEpisodes: number;
}

enum RewardId {
  Balloons = 'balloonsReward',
  Confetti = 'confettiReward',
}

export const EpisodesTracker: FC = (): JSX.Element => {
  const {
    isLoading,
    isRefreshing,
    activeSeriesId,
    isRewardShownMap,
    trackingSeriesData,
    favoritesSeriesMap,
    setIsRewardShown,
    removeSeries,
    toggleFavorites,
    refreshSeries,
  } = useSeriesStore(
    useShallow(state => ({
      isLoading: state.isLoading,
      isRefreshing: state.isRefreshing,
      activeSeriesId: state.activeSeriesId,
      isRewardShownMap: state.isRewardShownMap,
      trackingSeriesData: state.trackingSeriesData,
      favoritesSeriesMap: state.favoritesSeriesMap,
      setIsRewardShown: state.setIsRewardShown,
      removeSeries: state.removeSeries,
      toggleFavorites: state.toggleFavorites,
      refreshSeries: state.refreshSeries,
    })),
  );

  const { clearFilterQuery } = useFilterStore(
    useShallow(state => ({
      clearFilterQuery: state.clearFilterQuery,
    })),
  );
  const { clearSearch } = useSearchStore(
    useShallow(state => ({
      clearSearch: state.clearSearch,
    })),
  );

  const dialogRef = useRef<SeenitDialogHandle>(null);

  const activeTrackingSeries: Nullable<TrackingSeries> =
    activeSeriesId && trackingSeriesData ? trackingSeriesData[activeSeriesId] : null;

  const seasonsDisplayData = useMemo<Nullable<SeasonDisplayData[]>>(() => {
    if (!activeTrackingSeries?.seasons) return null;

    const seasons = Object.values(activeTrackingSeries.seasons);

    return seasons.map(season => {
      const episodes = Object.values(season.episodes);
      return {
        seriesId: activeTrackingSeries.id,
        season,
        totalEpisodes: episodes.length,
        watchedEpisodes: episodes.filter(ep => ep.isWatched).length,
      };
    });
  }, [activeTrackingSeries]);

  const seriesCompletion = useMemo(() => {
    if (!seasonsDisplayData) return { total: 0, watched: 0, isCompleted: false };

    let total = 0;
    let watched = 0;

    seasonsDisplayData.forEach((data: SeasonDisplayData) => {
      const episodes = Object.values(data.season.episodes);
      total += episodes.length;
      watched += episodes.filter(ep => ep.isWatched).length;
    });

    return {
      total,
      watched,
      isCompleted: total > 0 && total === watched,
    };
  }, [seasonsDisplayData]);

  const isCompleted = seriesCompletion.isCompleted;
  const isEnded = activeTrackingSeries?.status === SeriesStatus.Ended;

  useSeriesCompletionReward({
    isCompleted,
    isEnded,
    activeSeriesId,
    isRewardShownMap,
    setIsRewardShown,
    balloonsRewardId: RewardId.Balloons,
    confettiRewardId: RewardId.Confetti,
  });

  const handleSeriesRemove = () => {
    dialogRef.current?.open();
  };

  const handleToggleFavorites = () => {
    if (activeSeriesId) {
      toggleFavorites(activeSeriesId);
    }
  };

  const handleRefreshSeriesData = () => {
    if (activeSeriesId) {
      refreshSeries(activeSeriesId);
    }
  };

  const handleSeriesConfirmRemove = () => {
    if (activeSeriesId) {
      removeSeries(activeSeriesId);
    }
  };

  useEffect(() => {
    if (!activeSeriesId) {
      clearFilterQuery();
      clearSearch();
    }
  }, [activeSeriesId, clearFilterQuery, clearSearch]);

  return (
    <main
      data-tag="e-tracker"
      className={clsx('light:bg-slate-200 relative flex h-full w-full flex-col bg-gray-900')}
    >
      {/* Header */}
      <div
        data-tag="e-tracker__header"
        className={clsx(
          'h-height-header relative z-10 flex items-center border-b-2 border-gray-700 p-3 shadow-xl shadow-gray-900',
          'light:border-slate-500/60 light:shadow-slate-200',
        )}
      >
        <Header />

        {/* Horizontal Loading Bar */}
        <Transition show={isLoading || isRefreshing}>
          <div
            data-tag="e-tracker__preloader"
            className="absolute -bottom-0.5 left-0 w-full transition duration-250 ease-out data-closed:opacity-0"
          >
            <LinearProgress className="h-0.5" />
          </div>
        </Transition>
      </div>

      {/* Main Container */}
      <div
        data-tag="e-tracker__container"
        className="flex flex-1 overflow-hidden"
      >
        {/* Sidebar */}
        <div data-tag="e-tracker__sidebar">
          <Sidebar />
        </div>

        {/* Main Content */}
        <div
          data-tag="e-tracker__content"
          className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-5 py-6"
        >
          {activeSeriesId && activeTrackingSeries ? (
            <>
              {/* Series Header */}
              <div data-tag="e-tracker__series-header">
                <SeriesHeader
                  key={activeSeriesId}
                  title={activeTrackingSeries.name}
                  status={activeTrackingSeries.status}
                  isFavorite={favoritesSeriesMap[activeSeriesId]}
                  toggleFavorites={handleToggleFavorites}
                  refreshSeriesData={handleRefreshSeriesData}
                  remove={handleSeriesRemove}
                />
              </div>

              {/* Seasons */}
              <div
                data-tag="e-tracker__seasons"
                className="mt-4 grow-1"
              >
                {seasonsDisplayData && activeSeriesId ? (
                  seasonsDisplayData.map(({ season, totalEpisodes, watchedEpisodes }) => (
                    <div
                      key={season.id}
                      className="relative mb-6 overflow-x-hidden"
                    >
                      {/* Season Header */}
                      <div data-tag="e-tracker__season-header">
                        <SeasonHeader
                          activeSeriesId={activeSeriesId}
                          seasonNumber={season.number}
                          seasonId={season.id}
                          totalEpisodes={totalEpisodes}
                          watchedEpisodes={watchedEpisodes}
                        />
                      </div>

                      {/* Episodes Grid */}
                      <div
                        data-tag="e-tracker__grid"
                        className="mt-6"
                      >
                        <EpisodesGrid
                          key={season.id}
                          season={season}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    tag-name="e-tracker__no-season"
                    className="flex h-full cursor-default flex-col items-center justify-center"
                  >
                    <WelcomeTVIcon />
                    <h2
                      className={clsx(
                        'light:text-slate-600 mt-6 max-w-xs text-center text-base font-medium text-gray-300',
                      )}
                    >
                      We couldn’t find any episode info <br /> for this series
                    </h2>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              tag-name="e-tracker__empty-state"
              className="-mt-10 flex h-full items-center justify-center"
            >
              <EmptySeriesState />
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-10 z-50 flex w-full justify-center">
        <span id={RewardId.Balloons}></span>
        <span id={RewardId.Confetti}></span>
      </div>

      <SeenitDialog
        ref={dialogRef}
        title={`Remove ${activeTrackingSeries?.name}?`}
        description="This will delete all your episodes progress"
        confirm={handleSeriesConfirmRemove}
      ></SeenitDialog>
    </main>
  );
};

EpisodesTracker.displayName = 'EpisodesTrackerComponent';
