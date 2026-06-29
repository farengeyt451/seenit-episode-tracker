import { ItemImage, LockWrapper, SeenitChip } from '@/components/ui';
import { SeriesStatus } from '@/enums';
import { useLicenseStore, useSeriesStore } from '@/store';
import { Image } from '@/types';
import { Nullable } from '@/utility-types';
import { getYear } from '@/utils';
import { Button } from '@headlessui/react';
import { ArrowPathIcon, StarIcon, TrashIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarSolidIcon } from '@heroicons/react/20/solid';
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
  premiered: Nullable<string>;
  ended: Nullable<string>;
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

const getStatusBgClass = (status: Nullable<SeriesStatus>): string => {
  if (!status) return 'bg-gray-700';

  switch (true) {
    case status === SeriesStatus.Running:
      return 'bg-green-700';
    case status === SeriesStatus.InDevelopment:
      return 'bg-yellow-700';
    case status === SeriesStatus.Ended:
      return 'bg-violet-700';
    case status === SeriesStatus.ToBeDetermined:
      return 'bg-red-700';
    default:
      return 'bg-gray-700';
  }
};

const getLifeSpan = (premiered: Nullable<string>, ended: Nullable<string>): Nullable<string> => {
  const start = getYear(premiered);
  const end = getYear(ended);

  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} –`;
  if (end) return `${end}`;
  return null;
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
  premiered,
  ended,
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

  const lifeSpan = getLifeSpan(premiered, ended);
  const topGenres = genres?.slice(0, 2).join(' · ');
  const progress = total > 0 ? Math.round((watched / total) * 100) : 0;

  return (
    <div
      data-tag="series-header"
      className="relative -mx-5 -mt-6 mb-1 overflow-hidden px-5 pt-6 pb-4"
    >
      {/* Blurred poster backdrop for cinematic, per-show theming */}
      {image?.original && (
        <div
          data-tag="series-header__backdrop"
          aria-hidden="true"
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-30 blur-2xl light:opacity-25"
          style={{ backgroundImage: `url(${image.original})` }}
        />
      )}
      {/* Scrim keeps text legible over the backdrop */}
      <div
        aria-hidden="true"
        className={clsx(
          'absolute inset-0',
          'bg-linear-to-b from-gray-900/50 via-gray-900/80 to-gray-900',
          'light:from-slate-200/40 light:via-slate-200/75 light:to-slate-200',
        )}
      />

      <div
        data-tag="series-header__content"
        className="light:text-slate-900 relative z-10 flex items-start justify-between gap-3 text-gray-200"
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
              'shadow-lg shadow-gray-950/50 ring-1 ring-white/10 light:ring-black/10',
            )}
          >
            <ItemImage
              image={image}
              seriesName={title}
            />
          </div>

          <div
            data-tag="series-header__meta"
            className="flex min-w-0 flex-col gap-1.5 pt-0.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <h3
                data-tag="series-header__title"
                title={title}
                className="min-w-0 max-w-44 cursor-default truncate text-[1.375rem] leading-tight font-medium"
              >
                {title}
              </h3>
              {status && (
                <SeenitChip
                  data-tag="series-header__status"
                  className={clsx(getStatusBgClass(status), 'shrink-0 rounded-full px-2 py-1')}
                >
                  <span className="p-0.5 text-xs text-white">{status}</span>
                </SeenitChip>
              )}
            </div>

            {(rating || lifeSpan || topGenres) && (
              <div
                data-tag="series-header__facts"
                className="light:text-slate-700 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-300"
              >
                {rating ? (
                  <span className="inline-flex items-center gap-0.5 font-semibold">
                    <StarSolidIcon className="size-3.5 text-amber-400 light:text-amber-500" />
                    {rating}
                  </span>
                ) : null}
                {rating && lifeSpan ? <span className="opacity-40">•</span> : null}
                {lifeSpan ? <span>{lifeSpan}</span> : null}
                {(rating || lifeSpan) && topGenres ? <span className="opacity-40">•</span> : null}
                {topGenres ? <span className="truncate">{topGenres}</span> : null}
              </div>
            )}

            {total > 0 && (
              <div
                data-tag="series-header__progress"
                className="mt-0.5 flex items-center gap-2"
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
