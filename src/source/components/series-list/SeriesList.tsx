import { SeriesItem } from '@/components/series-item';
import { useFilterStore, useSeriesStore } from '@/store';
import { FC, JSX, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { selectFilteredSeries } from './selectFilteredSeries';

export const SeriesList: FC<{
  showOnlyFavorites: boolean;
}> = ({ showOnlyFavorites }): JSX.Element => {
  const { activeSeriesId, seriesData, trackingSeriesData, favoritesSeriesMap, setActiveSeriesId } = useSeriesStore(
    useShallow(state => ({
      activeSeriesId: state.activeSeriesId,
      seriesData: state.seriesData,
      trackingSeriesData: state.trackingSeriesData,
      favoritesSeriesMap: state.favoritesSeriesMap,
      setActiveSeriesId: state.setActiveSeriesId,
    })),
  );

  const filterQuery = useFilterStore(useShallow(state => state.filterQuery));

  const filteredSeries = useMemo(
    () => selectFilteredSeries(seriesData, filterQuery, showOnlyFavorites, favoritesSeriesMap),
    [seriesData, filterQuery, showOnlyFavorites, favoritesSeriesMap],
  );

  const handleSeriesClick = (id: number) => {
    setActiveSeriesId(id);
  };

  return (
    <div
      data-tag="series-list"
      className="relative flex-1 overflow-hidden"
    >
      {filteredSeries?.map(series => (
        <SeriesItem
          key={series.id}
          series={series}
          trackingData={trackingSeriesData?.[series.id]}
          isActive={series.id === activeSeriesId}
          isFavorite={favoritesSeriesMap[series.id]}
          itemClick={handleSeriesClick}
        />
      ))}
    </div>
  );
};

SeriesList.displayName = 'SeriesListComponent';
