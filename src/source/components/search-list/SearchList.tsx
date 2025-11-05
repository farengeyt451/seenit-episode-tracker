import { SearchItem } from '@/components/search-item';
import { useSeriesStore } from '@/store';
import { SearchResponse } from '@/types';
import { FC, JSX } from 'react';
import { useShallow } from 'zustand/shallow';

interface SearchListProps {
  series: SearchResponse[];
  searchItemClick: (id: number) => void;
}

export const SearchList: FC<SearchListProps> = ({ series, searchItemClick }): JSX.Element => {
  const trackingSeriesMap = useSeriesStore(useShallow(state => state.trackingSeriesMap));

  return (
    <div data-tag="search-list">
      {series.map(({ show }) => (
        <SearchItem
          key={show.id}
          series={show}
          isTracking={trackingSeriesMap[show.id]}
          itemClick={id => searchItemClick(id)}
        />
      ))}
    </div>
  );
};

SearchItem.displayName = 'SearchItemComponent';
