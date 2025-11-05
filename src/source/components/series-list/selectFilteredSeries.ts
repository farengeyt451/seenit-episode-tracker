import { Series } from '@/types';
import { Nullable } from '@/utility-types';

export function selectFilteredSeries(
  seriesData: Nullable<Series[]>,
  filterQuery: Nullable<string>,
  showOnlyFavorites: boolean,
  favoritesSeriesMap: Record<number, boolean>,
): Series[] {
  if (!seriesData?.length) return [];

  const query = filterQuery?.trim().toLowerCase();
  const hasQuery = !!query;

  return seriesData.filter(series => {
    if (showOnlyFavorites && !favoritesSeriesMap[series.id]) return false;

    if (hasQuery) {
      const nameMatches = series.name.toLowerCase().includes(query);
      const genreMatches = series.genres?.some(g => g?.toLowerCase().includes(query)) ?? false;

      if (!nameMatches && !genreMatches) return false;
    }

    return true;
  });
}
