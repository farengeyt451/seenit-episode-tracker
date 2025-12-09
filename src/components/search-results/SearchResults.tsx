import { SearchList } from '@/components';
import { EmptyTVIcon, ErrorTVIcon, InfoSearchBlock, TypingTVIcon } from '@/components/ui';
import { DEFAULT_SEARCH_THROTTLE } from '@/constants';
import { useSearchStore } from '@/store';
import { Nullable } from '@/utility-types';
import { FC, JSX, useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';

interface SearchResultsProps {
  itemClick: (id: number) => void;
}

export const SearchResults: FC<SearchResultsProps> = ({ itemClick }): Nullable<JSX.Element> => {
  const { searchData, error } = useSearchStore(
    useShallow(state => ({
      searchData: state.searchData,
      error: state.error,
    })),
  );
  const [showEmptyMessage, setShowEmptyMessage] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (searchData?.length === 0) {
      timeoutId = setTimeout(() => {
        setShowEmptyMessage(true);
      }, DEFAULT_SEARCH_THROTTLE);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchData]);

  if (error) {
    return (
      <InfoSearchBlock>
        <ErrorTVIcon />
        <h3 className="light:text-red-600 mt-2 text-base font-semibold text-red-500">Something went wrong</h3>
        <p className="light:text-slate-700 mt-2 text-sm text-gray-400">Please try again</p>
      </InfoSearchBlock>
    );
  }

  if (!searchData) {
    return (
      <InfoSearchBlock>
        <TypingTVIcon />
        <h3 className="light:text-slate-800 mt-2 text-base font-semibold text-gray-300">Start typing to search!</h3>
        <p className="light:text-slate-700 mt-2 px-2 text-sm text-gray-400">
          Find your favorite TV series <br /> to start tracking
        </p>
      </InfoSearchBlock>
    );
  }

  if (searchData.length === 0) {
    return showEmptyMessage ? (
      <InfoSearchBlock>
        <EmptyTVIcon />
        <h3 className="light:text-slate-800 mt-2 text-base font-semibold text-gray-300">No results found</h3>
        <p className="light:text-slate-700 mt-2 text-sm text-gray-400">Try searching for another TV series!</p>
      </InfoSearchBlock>
    ) : null;
  }

  return (
    <SearchList
      series={searchData}
      searchItemClick={itemClick}
    />
  );
};

SearchResults.displayName = 'SearchResultsComponent';
