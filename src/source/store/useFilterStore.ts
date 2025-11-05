import { Nullable } from '@/utility-types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

enum FilterActionTypes {
  SetFilterQuery = 'setFilterQuery',
  ClearFilterQuery = 'clearFilterQuery',
}

type FilterStore = {
  filterQuery: Nullable<string>;
};

type FilterActions = {
  setFilterQuery: (query: string) => void;
  clearFilterQuery: () => void;
};

const initialState: FilterStore = {
  filterQuery: null,
} as const;

export const useFilterStore = create<FilterStore & FilterActions>()(
  devtools(
    set => ({
      ...initialState,
      setFilterQuery: (query: string) => {
        set(
          {
            filterQuery: query.toLowerCase(),
          },
          false,
          FilterActionTypes.SetFilterQuery,
        );
      },
      clearFilterQuery: () => {
        set(initialState, false, FilterActionTypes.ClearFilterQuery);
      },
    }),
    { name: 'Store', store: 'filter' },
  ),
);
