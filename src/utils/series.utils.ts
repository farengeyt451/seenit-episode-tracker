import { Series, TrackingEpisode, TrackingSeason, TrackingSeries } from '@/types';

/**
 * Creates a tracking data structure for a series with its seasons and episodes
 */
export const createTrackingSeriesData = (seriesData: Series): TrackingSeries => {
  if (!seriesData || !seriesData._embedded?.seasons?.length) {
    return {
      id: seriesData?.id ?? null,
      name: seriesData?.name ?? 'Unknown Series',
      status: null,
      seasons: null,
    };
  }

  const seasonsMap: Record<number, TrackingSeason> = {};

  for (const season of seriesData._embedded.seasons) {
    const episodesMap: Record<string, TrackingEpisode> = {};
    const episodeCount = season.episodeOrder;

    if (!episodeCount) continue;

    for (let i = 0; i < episodeCount; i++) {
      const episodeId = `${seriesData.id}:${season.id}:${i + 1}`;

      episodesMap[episodeId] = {
        id: episodeId,
        number: i + 1,
        isWatched: false,
        timestamp: null,
      };
    }

    seasonsMap[season.id] = {
      id: season.id,
      number: season.number,
      episodes: episodesMap,
    };
  }

  return {
    id: seriesData.id,
    name: seriesData.name,
    status: seriesData.status,
    seasons: seasonsMap,
  };
};

/**
 * Update a tracking data structure with new seasons and episodes
 */
export const updateTrackingSeriesData = (trackingSeries: TrackingSeries, updatedSeries: Series): TrackingSeries => {
  const freshTrackingData = createTrackingSeriesData(updatedSeries);

  if (!trackingSeries.seasons || !freshTrackingData.seasons) {
    return freshTrackingData;
  }

  for (const [seasonId, freshSeason] of Object.entries(freshTrackingData.seasons)) {
    const existingSeason = trackingSeries.seasons[Number(seasonId)];

    if (!existingSeason) continue;

    for (const [episodeId, freshEpisode] of Object.entries(freshSeason.episodes)) {
      const existingEpisode = existingSeason.episodes[episodeId];

      if (existingEpisode) {
        freshEpisode.isWatched = existingEpisode.isWatched;
        freshEpisode.timestamp = existingEpisode.timestamp;
      }
    }
  }

  return freshTrackingData;
};
