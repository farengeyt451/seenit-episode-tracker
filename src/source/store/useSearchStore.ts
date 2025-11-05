import { SEARCH_ENDPOINT } from '@/constants';
import { SearchResponse } from '@/types';
import { Nullable } from '@/utility-types';
import axios from 'axios';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

enum SearchActionTypes {
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
  Clear = 'clear',
}

type SearchStore = {
  searchData: Nullable<SearchResponse[]>;
  isSearching: boolean;
  error: Nullable<string>;
};

type SearchActions = {
  search: (query: string, signal?: AbortSignal) => Promise<void>;
  clearSearch: () => void;
};

const initialState: SearchStore = {
  searchData: null,
  isSearching: false,
  error: null,
} as const;

export const useSearchStore = create<SearchStore & SearchActions>()(
  immer(
    devtools(
      set => ({
        ...initialState,

        search: async (query: string, signal?: AbortSignal) => {
          set(
            draft => {
              draft.isSearching = true;
              draft.error = null;
            },
            false,
            SearchActionTypes.Loading,
          );

          try {
            const { data } = await axios.get<SearchResponse[]>(SEARCH_ENDPOINT, {
              params: { q: query },
              signal,
            });

            set(
              draft => {
                draft.searchData = data;
                draft.isSearching = false;
                draft.error = null;
              },
              false,
              SearchActionTypes.Success,
            );
          } catch (err: unknown) {
            if (axios.isCancel(err)) return;

            const errorMessage = err instanceof Error ? err.message : 'Search failed. Please try again';

            set(
              draft => {
                draft.isSearching = false;
                draft.error = errorMessage;
              },
              false,
              SearchActionTypes.Error,
            );
          }
        },

        clearSearch: () => {
          set(() => initialState, false, SearchActionTypes.Clear);
        },
      }),
      { name: 'Store', store: 'search' },
    ),
  ),
);
