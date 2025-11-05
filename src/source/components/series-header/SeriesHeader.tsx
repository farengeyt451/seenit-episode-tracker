import { SeenitChip } from '@/components/ui';
import { SeriesStatus } from '@/enums';
import { useSeriesStore } from '@/store';
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

export const SeriesHeader: FC<SeriesHeaderProps> = ({
  title,
  status,
  isFavorite,
  toggleFavorites,
  refreshSeriesData,
  remove,
}): JSX.Element => {
  const { isRefreshing } = useSeriesStore(
    useShallow(state => ({
      isRefreshing: state.isRefreshing,
    })),
  );

  return (
    <div
      data-tag="series-header"
      className="light:text-slate-900 flex items-center justify-between gap-4 text-gray-200"
    >
      <div
        data-tag="series-header__info"
        className="flex items-center gap-3"
      >
        <h3
          data-tag="series-header__title"
          title={title}
          className="leading-2xl w-full max-w-52 cursor-default truncate text-[1.375rem] font-medium"
        >
          {title}
        </h3>
        <SeenitChip
          data-tag="series-header__status"
          className={clsx(getStatusBgClass(status), 'rounded-full bg-green-600 px-2 py-1')}
        >
          <span className="p-0.5 text-xs text-white">{status}</span>
        </SeenitChip>
      </div>

      <div
        data-tag="series-header__actions"
        className="flex"
      >
        <Button
          type="button"
          data-tag="series-header__refresh"
          className={clsx(actionButtonBaseClasses)}
          disabled={isRefreshing}
          aria-label="Refresh series data"
          onClick={refreshSeriesData}
        >
          <ArrowPathIcon
            className="light:group-hover:text-blue-600 size-5 group-hover:text-blue-500"
            aria-hidden="true"
          />
          <span className="sr-only">Refresh series data</span>
        </Button>

        <Button
          type="button"
          data-tag="series-header__favorites"
          className={actionButtonBaseClasses}
          disabled={isRefreshing}
          aria-label="Toggle favorites"
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

        <Button
          type="button"
          data-tag="series-header__remove"
          className={actionButtonBaseClasses}
          disabled={isRefreshing}
          aria-label="Remove series"
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
  );
};

SeriesHeader.displayName = 'SeriesHeaderComponent';
