import { ItemImage, SeenitChip } from '@/components/ui';
import { Series } from '@/types';
import { Nullable } from '@/utility-types';
import { getYear } from '@/utils';
import { CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { FC, JSX } from 'react';

interface SearchItemProps {
  series: Series;
  isTracking: boolean;
  itemClick: (id: number) => void;
}

const getRatingBgClass = (rating: Nullable<number>): string => {
  if (!rating) return 'bg-gray-700 light:bg-slate-300';

  switch (true) {
    case rating >= 8:
      return 'bg-green-700 light:bg-green-400';
    case rating >= 6:
      return 'bg-yellow-700 light:bg-yellow-400';
    case rating >= 3:
      return 'bg-orange-700 light:bg-orange-400';
    case rating >= 1:
      return 'bg-red-700 light:bg-red-400';
    default:
      return 'bg-gray-700 light:bg-slate-300';
  }
};

const getSeriesLifeDates = (premiered: Nullable<string>, ended: Nullable<string>): string => {
  const seriesPremiered = getYear(premiered);
  const seriesEnded = getYear(ended);

  if (seriesPremiered && seriesEnded) {
    return `${seriesPremiered} – ${seriesEnded}`;
  } else if (seriesPremiered && !seriesEnded) {
    return `Premiered: ${seriesPremiered}`;
  } else if (!seriesPremiered && seriesEnded) {
    return `Ended: ${seriesEnded}`;
  } else {
    return '';
  }
};

export const SearchItem: FC<SearchItemProps> = ({
  series: { id, image, name, rating, premiered, ended },
  isTracking,
  itemClick,
}): JSX.Element => {
  const seriesLifeDates = getSeriesLifeDates(premiered, ended);

  return (
    <a
      data-tag="search-item"
      className={clsx(
        'group relative flex h-15 cursor-pointer overflow-hidden rounded-full',
        'transition-colors duration-150 ease-in',
        'bg-gray-900/50 not-first:mt-4 hover:bg-gray-900/90',
        'light:bg-slate-100 light:hover:bg-slate-300',
        isTracking &&
          'pointer-events-none relative border-green-500/10 bg-gradient-to-r from-green-700/50 via-green-500/20 to-gray-900/95 shadow-inner contrast-[0.9] grayscale-[25%]',
        isTracking && 'light:from-green-400 light:via-green-200 light:to-slate-300/30',
      )}
      onClick={() => itemClick(id)}
    >
      <div
        data-tag="search-item__content"
        className={clsx(
          'flex w-full transform items-center gap-2.5 transition-transform delay-50 duration-250 ease-in-out',
          'group-hover:-translate-x-8',
        )}
      >
        <div
          data-tag="search-item__cover-wrapper"
          className="h-full w-8 shrink-0"
        >
          <ItemImage
            image={image}
            seriesName={name}
          />
        </div>
        <div
          data-tag="search-item__info"
          className="flex w-full items-center gap-1"
        >
          <div
            data-tag="search-item__left"
            className={clsx(
              'light:text-slate-900 mt-0 flex flex-col items-start justify-center gap-1 py-1 font-semibold text-gray-200',
            )}
          >
            <h3
              data-tag="search-item__caption"
              className="inline-block w-42 truncate overflow-hidden whitespace-nowrap"
            >
              {name}
            </h3>
            <p
              data-tag="search-item__duration "
              className={clsx(
                'text-sm',
                isTracking ? 'light:text-slate-900 text-gray-200' : 'light:text-slate-600 text-gray-400',
              )}
            >
              {isTracking ? 'In the tracking list ' : seriesLifeDates}
            </p>
          </div>

          {!isTracking ? (
            <SeenitChip className={clsx(getRatingBgClass(rating?.average), 'h-5 w-9')}>
              <span>{rating?.average ?? 'n/a'}</span>
            </SeenitChip>
          ) : (
            <div className="absolute right-4">
              <CheckCircleIcon className="light:text-green-600 size-6 text-green-500" />
            </div>
          )}
        </div>
      </div>

      {/* Track button */}
      {!isTracking && (
        <div
          className={clsx(
            'absolute top-0 right-0 flex h-full w-14 items-center justify-center gap-2',
            'translate-x-full transform rounded-r-full bg-transparent',
            'transition-transform delay-100 duration-175 ease-in-out',
            'cursor-pointer group-hover:translate-x-0',
          )}
        >
          <PlusCircleIcon
            className="light:text-green-600 size-6 text-green-500"
            aria-hidden="true"
          />
        </div>
      )}
    </a>
  );
};

SearchItem.displayName = 'SearchItemComponent';
