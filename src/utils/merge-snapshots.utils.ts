import { TOMBSTONE_TTL_MS } from '@/constants';
import { FavoritesSeries } from '@/types';
import { Nullable } from '@/utility-types';
import { PersistedSeriesStore, SeriesTombstones } from '@/zod-schemas';
import { DateTime } from 'luxon';

// Union rule: for any key present in either map, true wins over false / absent.
// Used for trackingSeriesMap, favoritesSeriesMap, and isRewardShownMap
const mergeBooleanMaps = (local: Record<string, boolean>, cloud: Record<string, boolean>): Record<string, boolean> => {
  const result: Record<string, boolean> = { ...local };

  for (const [key, val] of Object.entries(cloud)) {
    result[key] = val || result[key] || false;
  }
  return result;
};

const mergeFavoritesSeriesMap = (
  local: PersistedSeriesStore['favoritesSeriesMap'],
  cloud: PersistedSeriesStore['favoritesSeriesMap'],
): PersistedSeriesStore['favoritesSeriesMap'] => {
  const result: Record<string, FavoritesSeries> = { ...local };

  for (const [seriesId, cloudFavorite] of Object.entries(cloud)) {
    const localFavorite = result[seriesId];

    if (!localFavorite) {
      result[seriesId] = cloudFavorite;
      continue;
    }

    if (cloudFavorite.timestamp && localFavorite.timestamp) {
      if (DateTime.fromISO(cloudFavorite.timestamp) > DateTime.fromISO(localFavorite.timestamp)) {
        result[seriesId] = cloudFavorite;
      }
      continue;
    }

    if (cloudFavorite.timestamp || localFavorite.timestamp) {
      result[seriesId] = cloudFavorite.timestamp ? cloudFavorite : localFavorite;
      continue;
    }

    result[seriesId] = {
      isFavorite: cloudFavorite.isFavorite || localFavorite.isFavorite,
      timestamp: null,
    };
  }

  return result;
};

// Union by series id. If the same series exists in both copies, keep the one
// with the higher `updated` value (TVMaze timestamp — higher = more recently
// refreshed from the API)
const mergeSeriesData = (
  local: PersistedSeriesStore['seriesData'],
  cloud: PersistedSeriesStore['seriesData'],
): PersistedSeriesStore['seriesData'] => {
  if (!local && !cloud) return null;
  if (!local) return cloud;
  if (!cloud) return local;

  const byId = new Map(local.map(s => [s.id, s]));

  for (const series of cloud) {
    const existing = byId.get(series.id);
    if (!existing || series.updated > existing.updated) {
      byId.set(series.id, series);
    }
  }

  return Array.from(byId.values());
};

// Additive merge at the episode level. Decision for each episode:
//   - Both timestamps null → isWatched: true wins; tie → keep local
//   - One timestamp null   → non-null wins (explicit action beats never-set)
//   - Both non-null        → later timestamp wins; equal → isWatched: true wins; tie → keep local
const mergeTrackingData = (
  local: PersistedSeriesStore['trackingSeriesData'],
  cloud: PersistedSeriesStore['trackingSeriesData'],
): PersistedSeriesStore['trackingSeriesData'] => {
  if (!local && !cloud) return null;
  if (!local) return cloud;
  if (!cloud) return local;

  const result: NonNullable<PersistedSeriesStore['trackingSeriesData']> = { ...local };

  for (const [seriesId, cloudSeries] of Object.entries(cloud)) {
    const localSeries = result[seriesId];

    if (!localSeries) {
      result[seriesId] = cloudSeries;
      continue;
    }

    const mergedSeasons: typeof localSeries.seasons = localSeries.seasons ? { ...localSeries.seasons } : {};

    if (cloudSeries.seasons) {
      for (const [seasonId, cloudSeason] of Object.entries(cloudSeries.seasons)) {
        const localSeason = mergedSeasons?.[seasonId];

        if (!localSeason) {
          mergedSeasons[seasonId] = cloudSeason;
          continue;
        }

        const mergedEpisodes = { ...localSeason.episodes };

        for (const [episodeId, cloudEp] of Object.entries(cloudSeason.episodes)) {
          const localEp = mergedEpisodes[episodeId];

          if (!localEp) {
            mergedEpisodes[episodeId] = cloudEp;
            continue;
          }

          const localTs = localEp.timestamp;
          const cloudTs = cloudEp.timestamp;

          let winner = localEp;

          if (localTs === null && cloudTs === null) {
            if (cloudEp.isWatched && !localEp.isWatched) winner = cloudEp;
          } else if (localTs === null) {
            winner = cloudEp;
          } else if (cloudTs === null) {
            // localTs not null, cloudTs null → local wins (already default)
          } else {
            if (cloudTs > localTs) {
              winner = cloudEp;
            } else if (cloudTs === localTs && cloudEp.isWatched && !localEp.isWatched) {
              winner = cloudEp;
            }
          }

          mergedEpisodes[episodeId] = winner;
        }

        mergedSeasons[seasonId] = { ...localSeason, episodes: mergedEpisodes };
      }
    }

    result[seriesId] = { ...localSeries, seasons: mergedSeasons };
  }

  return result;
};

// Compute the most recent episode timestamp for a given series, across BOTH
// sides of the merge. Returns null if no episode in either copy was ever
// explicitly toggled (i.e. lastActivityAt is -∞ for the deletion comparison)
const lastActivityAt = (
  seriesId: string,
  local: PersistedSeriesStore['trackingSeriesData'],
  cloud: PersistedSeriesStore['trackingSeriesData'],
): string | null => {
  let max: string | null = null;

  const scan = (data: PersistedSeriesStore['trackingSeriesData']) => {
    const series = data?.[seriesId];
    if (!series?.seasons) return;
    for (const season of Object.values(series.seasons)) {
      for (const ep of Object.values(season.episodes)) {
        if (ep?.timestamp && (max === null || ep.timestamp > max)) {
          max = ep.timestamp;
        }
      }
    }
  };

  scan(local);
  scan(cloud);
  return max;
};

// Merge two tombstone maps, then GC anything older than the TTL.
//
//   step 1 — for each id present on either side, pick the later deletedAt.
//   step 2 — for each tombstoned id, decide whether the user has interacted
//            with the series after the deletion (resurrection) by comparing
//            deletedAt against lastActivityAt across both tracking maps.
//   step 3 — drop tombstones older than TOMBSTONE_TTL_MS so the table can't
//            grow without bound (a 60-day window covers any plausible offline
//            scenario; longer absences are vanishingly rare in practice).
//
// Returns { tombstones, resurrected } so the caller can filter the resurrected
// ids out of the deletion path (they remain as live series in the merged data)
const mergeTombstones = (
  localTombstones: SeriesTombstones,
  cloudTombstones: SeriesTombstones,
  localTracking: PersistedSeriesStore['trackingSeriesData'],
  cloudTracking: PersistedSeriesStore['trackingSeriesData'],
): { tombstones: SeriesTombstones; resurrected: Set<string> } => {
  const merged: SeriesTombstones = {};
  const resurrected = new Set<string>();

  const ids = new Set([...Object.keys(localTombstones), ...Object.keys(cloudTombstones)]);
  const nowMs = Date.now();

  for (const id of ids) {
    const localTs = localTombstones[id]?.deletedAt;
    const cloudTs = cloudTombstones[id]?.deletedAt;
    const deletedAt = localTs && cloudTs ? (localTs > cloudTs ? localTs : cloudTs) : (localTs ?? cloudTs)!;

    // GC: drop tombstones beyond the TTL. Series stays gone regardless because
    // the live state on both sides has already been reconciled by the time any
    // offline device this old comes back online.
    if (nowMs - new Date(deletedAt).getTime() > TOMBSTONE_TTL_MS) continue;

    const activity = lastActivityAt(id, localTracking, cloudTracking);

    if (activity !== null && activity > deletedAt) {
      // User interacted with this series AFTER the deletion → resurrection.
      // Drop the tombstone and keep the series alive in the merged state.
      resurrected.add(id);
      continue;
    }

    merged[id] = { deletedAt };
  }

  return { tombstones: merged, resurrected };
};

// Strip every reference to a tombstoned id from the merged state. This is the
// step that actually makes deletions visible on the other device — without it
// we'd merge the tombstone but the series would still appear in seriesData.
const applyTombstones = (
  state: PersistedSeriesStore,
  tombstones: SeriesTombstones,
  resurrected: Set<string>,
): PersistedSeriesStore => {
  const deadIds = new Set<string>();
  for (const id of Object.keys(tombstones)) {
    if (!resurrected.has(id)) deadIds.add(id);
  }
  if (deadIds.size === 0) return state;

  const numericDeadIds = new Set([...deadIds].map(Number));

  return {
    ...state,
    seriesData: state.seriesData?.filter(s => !numericDeadIds.has(s.id)) ?? null,
    trackingSeriesMap: filterMap(state.trackingSeriesMap, deadIds),
    favoritesSeriesMap: filterMap(state.favoritesSeriesMap, deadIds),
    isRewardShownMap: filterMap(state.isRewardShownMap, deadIds),
    trackingSeriesData: state.trackingSeriesData ? filterMap(state.trackingSeriesData, deadIds) : null,
    // If the user's currently-active series was deleted on another device,
    // unset it; the EpisodesTracker will show the empty state.
    activeSeriesId:
      state.activeSeriesId !== null && deadIds.has(String(state.activeSeriesId)) ? null : state.activeSeriesId,
  };
};

const filterMap = <T>(map: Record<string, T>, deadIds: Set<string>): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(map)) {
    if (!deadIds.has(k)) out[k] = v;
  }
  return out;
};

const setActiveSeriesId = (local: PersistedSeriesStore, cloud: PersistedSeriesStore): Nullable<number> => {
  let activeSeriesId: Nullable<number> = null;

  if (local.activeSeriesId) {
    activeSeriesId = local.activeSeriesId;
  } else if (local.seriesData?.length) {
    activeSeriesId = local.seriesData[0]?.id ?? null;
  } else if (cloud.activeSeriesId) {
    activeSeriesId = cloud.activeSeriesId;
  } else if (cloud.seriesData?.length) {
    activeSeriesId = cloud.seriesData[0]?.id ?? null;
  }

  return activeSeriesId;
};
export const mergeStates = (local: PersistedSeriesStore, cloud: PersistedSeriesStore): PersistedSeriesStore => {
  const localTombstones = local.seriesTombstones ?? {};
  const cloudTombstones = cloud.seriesTombstones ?? {};

  const { tombstones, resurrected } = mergeTombstones(
    localTombstones,
    cloudTombstones,
    local.trackingSeriesData,
    cloud.trackingSeriesData,
  );

  const merged: PersistedSeriesStore = {
    activeSeriesId: setActiveSeriesId(local, cloud),
    seriesData: mergeSeriesData(local.seriesData, cloud.seriesData),
    trackingSeriesMap: mergeBooleanMaps(local.trackingSeriesMap, cloud.trackingSeriesMap),
    favoritesSeriesMap: mergeFavoritesSeriesMap(local.favoritesSeriesMap, cloud.favoritesSeriesMap),
    isRewardShownMap: mergeBooleanMaps(local.isRewardShownMap, cloud.isRewardShownMap),
    trackingSeriesData: mergeTrackingData(local.trackingSeriesData, cloud.trackingSeriesData),
    seriesTombstones: tombstones,
  };

  return applyTombstones(merged, tombstones, resurrected);
};
