import { FavoritesSeries, Series, SeriesOrder } from '@/types';
import { Nullable } from '@/utility-types';

function orderSeries(seriesData: Series[], seriesOrder: Nullable<SeriesOrder>): Series[] {
  const ids = seriesOrder?.ids;
  if (!ids?.length) return seriesData;

  const rank = new Map(ids.map((id, index) => [id, index]));
  const fallback = ids.length;

  return [...seriesData].sort((a, b) => {
    const rankA = rank.get(a.id) ?? fallback;
    const rankB = rank.get(b.id) ?? fallback;
    return rankA - rankB;
  });
}

export function selectFilteredSeries(
  seriesData: Nullable<Series[]>,
  filterQuery: Nullable<string>,
  showOnlyFavorites: boolean,
  favoritesSeriesMap: Record<number, FavoritesSeries>,
  seriesOrder: Nullable<SeriesOrder>,
): Series[] {
  if (!seriesData?.length) return [];

  const query = filterQuery?.trim().toLowerCase();
  const hasQuery = !!query;

  return orderSeries(seriesData, seriesOrder).filter(series => {
    if (showOnlyFavorites && !favoritesSeriesMap[series.id]?.isFavorite) return false;

    if (hasQuery) {
      const nameMatches = series.name.toLowerCase().includes(query);
      const genreMatches = series.genres?.some(g => g?.toLowerCase().includes(query)) ?? false;

      if (!nameMatches && !genreMatches) return false;
    }

    return true;
  });
}
