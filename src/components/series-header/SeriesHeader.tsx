import { ItemImage, LockWrapper } from '@/components/ui';
import { SeriesStatus } from '@/enums';
import { useLicenseStore, useSeriesStore } from '@/store';
import { Image } from '@/types';
import { Nullable } from '@/utility-types';
import { Button } from '@headlessui/react';
import { ArrowPathIcon, StarIcon, TrashIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { FC, JSX } from 'react';
import { useShallow } from 'zustand/shallow';

interface SeriesHeaderProps {
  title: string;
  status: Nullable<SeriesStatus>;
  isFavorite: boolean;
  image: Nullable<Image>;
  rating: Nullable<number>;
  genres: string[];
  watched: number;
  total: number;
  remove: () => void;
  toggleFavorites: () => void;
  refreshSeriesData: () => void;
}
const actionButtonBaseClasses = clsx(
  'shrink-0',
  'rounded-full p-1.5',
  'cursor-pointer bg-transparent text-gray-400 light:text-gray-600',
  'transition-colors duration-250 ease-linear',
  'group hover:text-white light:hover:text-black',
  'disabled:cursor-default disabled:opacity-50 disabled:pointer-events-none',
);

const getStatusDotClass = (status: Nullable<SeriesStatus>): string => {
  switch (true) {
    case status === SeriesStatus.Running:
      return 'bg-green-500 light:bg-green-600';
    case status === SeriesStatus.InDevelopment:
      return 'bg-yellow-500 light:bg-yellow-600';
    case status === SeriesStatus.Ended:
      return 'bg-violet-400 light:bg-violet-600';
    case status === SeriesStatus.ToBeDetermined:
      return 'bg-red-500 light:bg-red-600';
    default:
      return 'bg-gray-500 light:bg-slate-400';
  }
};

const getRatingChipClass = (rating: number): string => {
  switch (true) {
    case rating >= 8:
      return 'bg-green-700 light:bg-green-500';
    case rating >= 6:
      return 'bg-yellow-700 light:bg-yellow-500';
    case rating >= 3:
      return 'bg-orange-700 light:bg-orange-500';
    case rating >= 1:
      return 'bg-red-700 light:bg-red-500';
    default:
      return 'bg-gray-700 light:bg-slate-400';
  }
};

const getProgressColor = (progress: number): string => {
  switch (true) {
    case progress >= 100:
      return 'light:bg-amber-500 bg-amber-400';
    case progress >= 70:
      return 'light:bg-green-600 bg-green-500/80';
    case progress >= 30:
      return 'light:bg-yellow-600 bg-yellow-500/80';
    default:
      return 'light:bg-red-600 bg-red-500/70';
  }
};

export const SeriesHeader: FC<SeriesHeaderProps> = ({
  title,
  status,
  isFavorite,
  image,
  rating,
  genres,
  watched,
  total,
  toggleFavorites,
  refreshSeriesData,
  remove,
}): JSX.Element => {
  const isLicenseActivated = useLicenseStore(state => state.isLicenseActivated);

  const { isRefreshing } = useSeriesStore(
    useShallow(state => ({
      isRefreshing: state.isRefreshing,
    })),
  );

  const topGenres = genres?.slice(0, 2).join(' · ');
  const progress = total > 0 ? Math.round((watched / total) * 100) : 0;

  return (
    <div
      data-tag="series-header"
      className="mb-1"
    >
      <div
        data-tag="series-header__content"
        className="light:text-slate-900 flex items-start justify-between gap-3 text-gray-200"
      >
        <div
          data-tag="series-header__info"
          className="flex min-w-0 gap-3"
        >
          {/* Crisp portrait poster */}
          <div
            data-tag="series-header__poster"
            className={clsx(
              'h-24 w-16 shrink-0 overflow-hidden rounded-xl',
              'light:ring-black/10 shadow-lg ring-1 shadow-gray-950/50 ring-white/10',
            )}
          >
            <ItemImage
              image={image}
              seriesName={title}
            />
          </div>

          <div
            data-tag="series-header__meta"
            className="flex min-w-0 flex-col gap-1.5"
          >
            <h3
              data-tag="series-header__title"
              title={title}
              className="min-w-0 cursor-default truncate text-[1.375rem] leading-tight font-medium"
            >
              {title}
            </h3>

            {(rating || status) && (
              <div
                data-tag="series-header__facts"
                className="flex cursor-default items-center gap-2.5 text-sm"
              >
                {rating ? (
                  <span
                    data-tag="series-header__rating"
                    title={`Rating ${rating}`}
                    className={clsx(
                      'inline-flex items-center rounded-md px-1.5 py-px text-xs font-bold text-white tabular-nums',
                      getRatingChipClass(rating),
                    )}
                  >
                    {rating}
                  </span>
                ) : null}
                {status ? (
                  <span
                    data-tag="series-header__status"
                    title={status}
                    className="light:text-slate-700 inline-flex items-center gap-1 font-medium text-gray-300"
                  >
                    {status === SeriesStatus.Running ? (
                      <span
                        aria-hidden="true"
                        className="relative inline-flex size-2 shrink-0 items-center justify-center"
                      >
                        <span
                          className={clsx(
                            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                            getStatusDotClass(status),
                          )}
                        />
                        <span
                          className={clsx('relative inline-flex size-1.5 rounded-full', getStatusDotClass(status))}
                        />
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className={clsx('size-1.5 shrink-0 rounded-full', getStatusDotClass(status))}
                      />
                    )}
                    {status}
                  </span>
                ) : null}
              </div>
            )}

            {topGenres ? (
              <p
                data-tag="series-header__genres"
                className="light:text-slate-700 cursor-default truncate text-sm font-medium text-gray-300"
              >
                {topGenres}
              </p>
            ) : null}

            {total > 0 && (
              <div
                data-tag="series-header__progress"
                className="flex cursor-default items-center gap-2"
              >
                <div className="light:bg-slate-300/80 h-1 w-24 overflow-hidden rounded-full bg-gray-700/80">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-300', getProgressColor(progress))}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="light:text-slate-600 text-[0.6875rem] font-medium text-gray-400">
                  {watched}/{total}
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          data-tag="series-header__actions"
          className="flex shrink-0"
        >
          <Button
            type="button"
            data-tag="series-header__refresh"
            className={clsx(actionButtonBaseClasses)}
            disabled={isRefreshing}
            aria-label="Refresh series data"
            title="Refresh series data"
            onClick={refreshSeriesData}
          >
            <ArrowPathIcon
              className="light:group-hover:text-blue-600 size-5 group-hover:text-blue-500"
              aria-hidden="true"
            />
            <span className="sr-only">Refresh series data</span>
          </Button>

          <LockWrapper>
            <Button
              type="button"
              data-tag="series-header__favorites"
              className={actionButtonBaseClasses}
              disabled={isRefreshing || !isLicenseActivated}
              aria-label="Toggle favorites"
              title="Toggle favorites"
              onClick={toggleFavorites}
            >
              <StarIcon
                className={clsx(
                  'size-5',
                  isFavorite
                    ? 'light:text-amber-600 light:group-hover:text-amber-700 text-yellow-400 group-hover:text-yellow-500'
                    : 'light:group-hover:text-amber-600 group-hover:text-yellow-400',
                )}
                aria-hidden="true"
              />
              <span className="sr-only">Toggle favorites</span>
            </Button>
          </LockWrapper>

          <Button
            type="button"
            data-tag="series-header__remove"
            className={actionButtonBaseClasses}
            disabled={isRefreshing}
            aria-label="Remove series"
            title="Remove series"
            onClick={remove}
          >
            <TrashIcon
              className="light:group-hover:text-red-600 size-5 group-hover:text-red-400"
              aria-hidden="true"
            />
            <span className="sr-only">Remove series</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

SeriesHeader.displayName = 'SeriesHeaderComponent';
