import { DEFAULT_SEARCH_THROTTLE, SEARCH_ENDPOINT } from '@/constants';
import { SearchResponse } from '@/types';
import { useThrottle } from '@uidotdev/usehooks';
import axios from 'axios';
import { useCallback, useEffect, useReducer, useRef } from 'react';

import { Nullable } from '@/utility-types';

interface SearchState {
  series: Nullable<SearchResponse[]>;
  isSearching: boolean;
  searchError: Nullable<string>;
}

export enum SearchActionTypesEnum {
  SetResponse = 'SET_RESPONSE',
  SetLoading = 'SET_LOADING',
  SetError = 'SET_ERROR',
  Reset = 'RESET',
}

type SearchAction =
  | { type: SearchActionTypesEnum.SetResponse; payload: SearchResponse[] }
  | { type: SearchActionTypesEnum.SetLoading; payload: boolean }
  | { type: SearchActionTypesEnum.SetError; payload: string }
  | { type: SearchActionTypesEnum.Reset };

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case SearchActionTypesEnum.SetResponse: {
      return {
        ...state,
        series: action.payload,
      };
    }
    case SearchActionTypesEnum.SetLoading: {
      return {
        ...state,
        isSearching: action.payload,
      };
    }
    case SearchActionTypesEnum.SetError: {
      return {
        ...state,
        searchError: action.payload,
      };
    }
    case SearchActionTypesEnum.Reset: {
      return searchInitialState;
    }
  }
};

const searchInitialState: SearchState = {
  series: null,
  isSearching: false,
  searchError: null,
} as const;

export const useSearchWithQuery = (searchQuery: string) => {
  const throttledSearchQuery = useThrottle(searchQuery, DEFAULT_SEARCH_THROTTLE);
  const [searchState, searchDispatch] = useReducer<SearchState, [SearchAction]>(searchReducer, searchInitialState);
  const abortControllerRef = useRef<Nullable<AbortController>>(null);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        searchDispatch({ type: SearchActionTypesEnum.Reset });
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      searchDispatch({ type: SearchActionTypesEnum.SetLoading, payload: true });

      try {
        const { data } = await axios.get<SearchResponse[]>(SEARCH_ENDPOINT, {
          params: { q: query },
          signal: abortControllerRef.current.signal,
        });
        searchDispatch({ type: SearchActionTypesEnum.SetResponse, payload: data });
      } catch (error) {
        if (!axios.isCancel(error)) {
          searchDispatch({
            type: SearchActionTypesEnum.SetError,
            payload: 'Search failed. Please try again',
          });
        }
      } finally {
        searchDispatch({ type: SearchActionTypesEnum.SetLoading, payload: false });
      }
    },
    [searchDispatch],
  );

  const clearSearch = useCallback(() => {
    searchDispatch({ type: SearchActionTypesEnum.Reset });

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [searchDispatch]);

  useEffect(() => {
    search(throttledSearchQuery);
  }, [throttledSearchQuery, search]);

  return {
    clearSearch,
    ...searchState,
  };
};
