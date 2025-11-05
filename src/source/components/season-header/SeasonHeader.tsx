import { SeenItButton } from '@/components/ui';
import { ToggleAllWatchedMode } from '@/enums';
import { useSeriesStore } from '@/store';
import clsx from 'clsx';
import { FC } from 'react';
import { useShallow } from 'zustand/shallow';

interface SeasonHeaderProps {
  activeSeriesId: number;
  seasonNumber: number;
  seasonId: number;
  totalEpisodes: number;
  watchedEpisodes: number;
}

export const SeasonHeader: FC<SeasonHeaderProps> = ({
  activeSeriesId,
  seasonNumber,
  seasonId,
  totalEpisodes,
  watchedEpisodes,
}) => {
  const { toggleAllWatched } = useSeriesStore(
    useShallow(state => ({
      toggleAllWatched: state.toggleAllWatched,
    })),
  );
  const progress = Math.round((watchedEpisodes / totalEpisodes) * 100);
  const isSeasonCompleted = progress === 100;

  const handleToggleAll = () => {
    toggleAllWatched(
      activeSeriesId,
      seasonId,
      isSeasonCompleted ? ToggleAllWatchedMode.Reset : ToggleAllWatchedMode.Complete,
    );
  };

  return (
    <div
      data-tag="season-header"
      className={clsx(
        'relative flex items-center justify-between',
        'light:after:bg-gray-400 rounded-md after:absolute after:-bottom-1.5 after:h-[1px] after:w-full after:bg-gray-700/70',
      )}
    >
      <div
        className={clsx(
          'absolute -bottom-1.75 z-10 h-[3px] rounded-md',
          'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          progress < 30
            ? 'light:bg-red-600 bg-red-500/70'
            : progress < 70
              ? 'light:bg-yellow-600 bg-yellow-500/70'
              : 'light:bg-green-600 bg-green-500/70',
          'tv-glow',
        )}
        style={{ width: `${progress}%` }}
      ></div>
      <div
        data-tag="season-header__group"
        className="flex cursor-default items-baseline justify-center gap-2"
      >
        <h3
          data-tag="season-header__title"
          className="light:text-slate-900 text-lg font-medium text-gray-200"
        >
          Season {seasonNumber}
        </h3>
        <span
          data-tag="season-header__watched"
          className="light:text-slate-600 text-sm text-gray-400"
        >
          Progress<span className="ml-1 inline-block font-semibold">{progress}%</span>
        </span>
      </div>

      <div
        data-tag="season-header__check all"
        className="mb-1.5 min-w-[96px]"
      >
        <SeenItButton
          className="w-full"
          colorType="outlined"
          size="small"
          onClick={handleToggleAll}
        >
          {isSeasonCompleted ? 'Unmark All' : 'Mark All'}
        </SeenItButton>
      </div>
    </div>
  );
};

SeasonHeader.displayName = 'SeasonHeaderComponent';
