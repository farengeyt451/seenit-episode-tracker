import { SearchInput, SearchInputHandle } from '@/components/search-input';
import { useSearchStore, useSeriesStore } from '@/store';
import { Nullable } from '@/utility-types';
import { FC, JSX, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const Search: FC = (): JSX.Element => {
  const inputRef = useRef<SearchInputHandle>(null);
  const { searchData, isSearching, search, clearSearch } = useSearchStore(
    useShallow(state => ({
      searchData: state.searchData,
      isSearching: state.isSearching,
      search: state.search,
      clearSearch: state.clearSearch,
    })),
  );

  const { clearErrorState } = useSeriesStore(
    useShallow(state => ({
      clearErrorState: state.clearErrorState,
    })),
  );

  const abortControllerRef = useRef<Nullable<AbortController>>(null);

  const handleInputChange = (query: string) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    search(query, abortControllerRef.current.signal);
  };

  const handleInputClear = () => {
    clearSearch();
    clearErrorState();
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!searchData) {
      inputRef.current?.clear();
    }
  }, [searchData]);

  return (
    <SearchInput
      ref={inputRef}
      placeholder="Search..."
      isSearching={isSearching}
      inputChange={handleInputChange}
      inputClear={handleInputClear}
    />
  );
};

Search.displayName = 'SearchComponent';
