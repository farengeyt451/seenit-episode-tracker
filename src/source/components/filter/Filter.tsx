import { SearchInput } from '@/components/search-input';
import { useFilterStore } from '@/store';
import { FC, JSX } from 'react';
import { useShallow } from 'zustand/shallow';

export const Filter: FC = (): JSX.Element => {
  const { setFilterQuery, clearFilterQuery } = useFilterStore(
    useShallow(state => ({
      setFilterQuery: state.setFilterQuery,
      clearFilterQuery: state.clearFilterQuery,
    })),
  );

  const handleInputChange = (query: string) => {
    setFilterQuery(query);
  };

  const handleInputClear = () => {
    clearFilterQuery();
  };

  return (
    <SearchInput
      placeholder="Filter by title or genre..."
      inputChange={handleInputChange}
      inputClear={handleInputClear}
    />
  );
};

Filter.displayName = 'FilterComponent';
