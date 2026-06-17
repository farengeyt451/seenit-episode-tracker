import { SeriesItem } from '@/components';
import { EmptyTVIcon, InfoSearchBlock } from '@/components/ui';
import { useFilterStore, useSeriesStore } from '@/store';
import { FavoritesSeries, Series, TrackingSeriesData } from '@/types';
import { Nullable } from '@/utility-types';
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { move } from '@dnd-kit/helpers';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { Squares2X2Icon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { FC, JSX, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { selectFilteredSeries } from './selectFilteredSeries';

interface SortableProps {
  id: number;
  index: number;
  series: Series;
  trackingSeriesData: Nullable<TrackingSeriesData>;
  activeSeriesId: Nullable<number>;
  favoritesSeriesMap: Record<string, FavoritesSeries>;
  isReorderEnabled: boolean;
  handleSeriesClick: (id: number) => void;
}

const Sortable = ({
  id,
  index,
  series,
  trackingSeriesData,
  activeSeriesId,
  favoritesSeriesMap,
  isReorderEnabled,
  handleSeriesClick,
}: SortableProps) => {
  const { ref, handleRef, isDragging } = useSortable({
    id,
    index,
    disabled: !isReorderEnabled,
    transition: {
      duration: 240,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    modifiers: [RestrictToVerticalAxis],
  });

  return (
    <li
      ref={ref}
      className={clsx('group relative block')}
    >
      <SeriesItem
        key={id}
        series={series}
        trackingData={trackingSeriesData?.[series.id]}
        isActive={series.id === activeSeriesId}
        isFavorite={favoritesSeriesMap[series.id]?.isFavorite}
        isDragging={isDragging}
        itemClick={handleSeriesClick}
      />
      {isReorderEnabled && (
        <button
          ref={handleRef}
          type="button"
          data-tag="series-item__drag-handle"
          aria-label="Drag to reorder"
          title="Drag to reorder"
          onClick={event => event.stopPropagation()}
          className={clsx(
            'absolute top-1/2 right-1 z-10 size-8 -translate-y-1/2',
            'flex touch-none items-center justify-center rounded-md p-1',
            'light:text-slate-500 text-gray-300',
            'opacity-50 transition-opacity duration-150 ease-out',
            'group-hover:opacity-100 focus-visible:opacity-100',
            isDragging ? 'cursor-grabbing opacity-100' : 'cursor-grab',
          )}
        >
          <Squares2X2Icon className="size-3" />
        </button>
      )}
    </li>
  );
};

export const SeriesList: FC<{
  showOnlyFavorites: boolean;
}> = ({ showOnlyFavorites }): JSX.Element => {
  const {
    activeSeriesId,
    seriesData,
    trackingSeriesData,
    favoritesSeriesMap,
    seriesOrder,
    setActiveSeriesId,
    reorderSeries,
  } = useSeriesStore(
    useShallow(state => ({
      activeSeriesId: state.activeSeriesId,
      seriesData: state.seriesData,
      trackingSeriesData: state.trackingSeriesData,
      favoritesSeriesMap: state.favoritesSeriesMap,
      seriesOrder: state.seriesOrder,
      setActiveSeriesId: state.setActiveSeriesId,
      reorderSeries: state.reorderSeries,
    })),
  );

  const filterQuery = useFilterStore(useShallow(state => state.filterQuery));

  const filteredSeries = useMemo(
    () => selectFilteredSeries(seriesData, filterQuery, showOnlyFavorites, favoritesSeriesMap, seriesOrder),
    [seriesData, filterQuery, showOnlyFavorites, favoritesSeriesMap, seriesOrder],
  );

  // Reordering writes a flat order list, so it is only well-defined over the
  // full, unfiltered list. Disable it while a search or favorites filter is on.
  const isReorderEnabled = !filterQuery?.trim() && !showOnlyFavorites;

  const handleSeriesClick = (id: number) => {
    setActiveSeriesId(id);
  };

  return (
    <DragDropProvider
      onDragEnd={event => {
        if (!isReorderEnabled || event.canceled) return;

        const currentIds = filteredSeries.map(series => series.id);
        const nextIds = move(currentIds, event);

        const orderChanged = nextIds.some((id, index) => id !== currentIds[index]);

        if (orderChanged) reorderSeries(nextIds);
      }}
    >
      <ul
        data-tag="series-list"
        className="relative mt-4 flex w-full flex-col gap-4 overflow-hidden"
      >
        {filteredSeries?.length ? (
          filteredSeries.map((series, index) => (
            <Sortable
              series={series}
              trackingSeriesData={trackingSeriesData}
              activeSeriesId={activeSeriesId}
              favoritesSeriesMap={favoritesSeriesMap}
              isReorderEnabled={isReorderEnabled}
              handleSeriesClick={handleSeriesClick}
              key={series.id}
              id={series.id}
              index={index}
            />
          ))
        ) : (
          <InfoSearchBlock>
            <EmptyTVIcon />
            <h3 className="light:text-slate-800 mt-2 text-base font-semibold text-gray-300">No favorites yet</h3>
            <p className="light:text-slate-700 mt-2 text-sm text-gray-400">Mark a series as favorite to see it here</p>
          </InfoSearchBlock>
        )}
      </ul>
    </DragDropProvider>
  );
};

SeriesList.displayName = 'SeriesListComponent';
