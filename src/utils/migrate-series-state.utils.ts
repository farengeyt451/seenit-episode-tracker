import { FavoritesSeries } from '@/types';

type MutableState = Record<string, unknown>;

/**
 * Migrates a persisted series-store `state` payload from an older `version` up
 * to SERIES_STATE_VERSION.
 *
 * Operates on loosely-typed input because legacy payloads (e.g.
 * favoritesSeriesMap stored as Record<string, boolean>) do not match the
 * current schema. Steps are cumulative (no early returns) and keyed on
 * `version < n`, so a payload at any older version is upgraded in one pass.
 * The input object is mutated and returned.
 */
export const migrateSeriesState = (state: unknown, version: number): MutableState => {
  const data: MutableState = state && typeof state === 'object' ? (state as MutableState) : {};

  // -> v2: introduce soft-delete tombstones.
  if (version < 2 && !data.seriesTombstones) {
    data.seriesTombstones = {};
  }

  // -> v3: favoritesSeriesMap went from Record<string, boolean> to FavoritesSeries objects.
  if (version < 3) {
    const legacyFavorites = (data.favoritesSeriesMap ?? {}) as Record<string, boolean | FavoritesSeries>;
    const migratedFavorites: Record<string, FavoritesSeries> = {};

    for (const [seriesId, value] of Object.entries(legacyFavorites)) {
      // Tolerate already-migrated entries so the step is idempotent on mixed data.
      migratedFavorites[seriesId] =
        typeof value === 'boolean'
          ? {
              isFavorite: value,
              // Legacy favorites have no known timestamp; null avoids making
              // them all look freshly favorited.
              timestamp: null,
            }
          : value;
    }

    data.favoritesSeriesMap = migratedFavorites;
  }

  // -> v4: introduce explicit seriesOrder, seeded from the existing seriesData
  // array order. updatedAt stays null so any real reorder (which sets a
  // timestamp) wins during last-writer-wins merge.
  if (version < 4 && !data.seriesOrder) {
    const series = Array.isArray(data.seriesData) ? data.seriesData : [];

    data.seriesOrder = {
      ids: series.map(s => s.id),
      updatedAt: null,
    };
  }

  return data;
};
