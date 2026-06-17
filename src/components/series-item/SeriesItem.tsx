import { ItemImage } from '@/components/ui';
import { SeriesStatus, Theme } from '@/enums';
import { useThemeStore } from '@/store';
import { Series, TrackingSeries } from '@/types';
import { Nullable } from '@/utility-types';
import { SparklesIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';
import { FC, JSX, useMemo } from 'react';

interface SeriesItemProps {
  series: Series;
  trackingData: TrackingSeries | undefined;
  isActive: boolean;
  isFavorite: boolean;
  isDragging?: boolean;
  itemClick: (id: number) => void;
}

export const SeriesItem: FC<SeriesItemProps> = ({
  series: { id, image, name, status },
  trackingData,
  isActive,
  isFavorite,
  isDragging = false,
  itemClick,
}): JSX.Element => {
  const isEnded = status === SeriesStatus.Ended;
  const isLightTheme = useThemeStore(state => state.theme) === Theme.Light;
  const favoritePatternStroke = isLightTheme ? 'b45309' : 'fbbf24';
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
        'transition-all duration-150 ease-in',
        'light:bg-white light:shadow-sm light:border light:border-slate-200 bg-gray-900/50',
        'will-change-transform',
        isActive
          ? 'light:from-blue-200/90 light:via-sky-200/80 light:to-slate-50/70 light:border-sky-200 cursor-default bg-linear-to-r from-purple-900/60 via-violet-800/40 to-blue-900/20'
          : 'light:hover:bg-slate-300 cursor-pointer hover:bg-gray-900/90',
        isDragging && 'scale-105 bg-gray-900/90',
      )}
      onClick={() => itemClick(id)}
    >
      {isFavorite && (
        <span
          data-tag="series-item__favorite-pattern"
          aria-hidden="true"
          className={clsx(
            'pointer-events-none absolute inset-0 z-0 bg-size-[150px_60px] bg-center bg-repeat-x',
            'light:opacity-[0.38] opacity-[0.24]',
            'mask-[linear-gradient(to_right,transparent,black)]',
            '[-webkit-mask-image:linear-gradient(to_right,transparent,black)]',
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='150'%20height='60'%20viewBox='0%200%20150%2060'%3E%3Cdefs%3E%3Cpolygon%20id='s'%20points='0,-10%202.35,-3.24%209.51,-3.09%203.8,1.24%205.88,8.09%200,4%20-5.88,8.09%20-3.8,1.24%20-9.51,-3.09%20-2.35,-3.24'/%3E%3C/defs%3E%3Cg%20fill='none'%20stroke='%23${favoritePatternStroke}'%20stroke-width='1.6'%20stroke-linejoin='round'%3E%3Cuse%20href='%23s'%20transform='translate(24%2020)%20rotate(-12)%20scale(1.15)'/%3E%3Cuse%20href='%23s'%20transform='translate(74%2042)%20rotate(16)%20scale(0.75)'/%3E%3Cuse%20href='%23s'%20transform='translate(120%2022)%20rotate(6)%20scale(1)'/%3E%3Cuse%20href='%23s'%20transform='translate(56%2012)%20rotate(-24)%20scale(0.5)'/%3E%3Ccircle%20cx='98'%20cy='13'%20r='1.6'/%3E%3Ccircle%20cx='140'%20cy='45'%20r='1.6'/%3E%3Ccircle%20cx='40'%20cy='46'%20r='1.4'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      )}
      <div
        data-tag="series-item__content"
        className={clsx(
          'relative z-10 flex w-full transform items-center gap-2.5 transition-transform delay-50 duration-250 ease-in-out',
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
            <h3
              data-tag="series-item__caption"
              title={name}
              className="inline-block w-full max-w-46 items-center truncate align-middle"
            >
              {name}
            </h3>
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
                  <>
                    <span className="font-bold">{`${episodesDisplayData.watched}/${episodesDisplayData.total}`}</span>{' '}
                    episodes watched
                  </>
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
