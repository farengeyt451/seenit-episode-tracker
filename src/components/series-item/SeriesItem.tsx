import { ItemImage } from '@/components/ui';
import { SeriesStatus } from '@/enums';
import { Series, TrackingSeries } from '@/types';
import { Nullable } from '@/utility-types';
import { SparklesIcon, StarIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';
import { FC, JSX, useMemo } from 'react';

interface SeriesItemProps {
  series: Series;
  trackingData: TrackingSeries | undefined;
  isActive: boolean;
  isFavorite: boolean;
  itemClick: (id: number) => void;
}

export const SeriesItem: FC<SeriesItemProps> = ({
  series: { id, image, name, status },
  trackingData,
  isActive,
  isFavorite,
  itemClick,
}): JSX.Element => {
  const isEnded = status === SeriesStatus.Ended;
  const episodesDisplayData = useMemo<Nullable<{ watched: number; total: number; isCompleted: boolean }>>(() => {
    if (!trackingData?.seasons) return null;

    let total = 0;
    let watched = 0;

    const seasons = Object.values(trackingData.seasons);

    seasons.map(season => {
      const episodes = Object.values(season.episodes);

      total += episodes.length;
      watched += episodes.filter(ep => ep.isWatched).length;
    });

    const isCompleted = total === watched;

    return {
      watched,
      total,
      isCompleted,
    };
  }, [trackingData]);

  return (
    <a
      data-tag="series-item"
      className={clsx(
        'group relative flex h-15 w-full overflow-hidden rounded-full',
        'transition-colors duration-150 ease-in',
        'light:bg-white light:shadow-sm light:border light:border-slate-200 bg-gray-900/50 not-first:mt-4',
        isActive
          ? 'light:from-blue-200/90 light:via-sky-200/80 light:to-slate-50/70 light:border-sky-200 cursor-default bg-linear-to-r from-purple-900/60 via-violet-800/40 to-blue-900/20'
          : 'light:hover:bg-slate-300 cursor-pointer hover:bg-gray-900/90',
      )}
      onClick={() => itemClick(id)}
    >
      <div
        data-tag="series-item__content"
        className={clsx(
          'flex w-full transform items-center gap-2.5 transition-transform delay-50 duration-250 ease-in-out',
        )}
      >
        <div
          data-tag="series-item__cover-wrapper"
          className={clsx('relative h-full w-8 shrink-0')}
        >
          <ItemImage
            image={image}
            seriesName={name}
          />
        </div>
        <div
          data-tag="series-item__info"
          className="flex w-full items-center gap-1"
        >
          <div
            data-tag="series-item__left"
            className={clsx(
              'light:text-slate-900 mt-0 flex flex-col items-start justify-center gap-1 py-1 pr-2 font-semibold text-gray-200',
              'w-54',
            )}
          >
            <div className="flex items-center">
              <h3
                data-tag="series-item__caption"
                title={name}
                className="inline-block w-full max-w-46 items-center truncate align-middle"
              >
                {name}
              </h3>
              {isFavorite && (
                <StarIcon
                  className={clsx('light:text-amber-700 mt-0.5 ml-0.5 inline-block size-4 text-yellow-400')}
                  aria-hidden="true"
                />
              )}
            </div>
            {episodesDisplayData && (
              <p
                data-tag="series-item__stat"
                className={clsx(
                  'text-sm',
                  episodesDisplayData.isCompleted
                    ? 'light:text-amber-700 text-amber-400'
                    : 'light:text-slate-600 text-gray-400',
                )}
              >
                {episodesDisplayData.isCompleted && isEnded ? (
                  <span className="inline-flex items-center gap-1">
                    You've seen it all <SparklesIcon className="light:text-amber-700 size-4 text-amber-400" />
                  </span>
                ) : (
                  `${episodesDisplayData.watched}/${episodesDisplayData.total} episodes watched`
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
};

SeriesItem.displayName = 'SeriesItemComponent';
