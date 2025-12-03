import { z } from 'zod';

const ImageSchema = z.object({
  medium: z.string().nullable(),
  original: z.string().nullable(),
});

const RemoteCountrySchema = z.object({
  name: z.string(),
  code: z.string(),
  timezone: z.string(),
});

const RemoteNetworkSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: RemoteCountrySchema.nullable(),
  officialSite: z.string().nullable(),
});

const RemoteWebChannelSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: RemoteCountrySchema.nullable(),
  officialSite: z.string().nullable(),
});

const EpisodeSchema = z.object({
  id: z.number(),
  url: z.string().nullable(),
  name: z.string(),
  season: z.number(),
  number: z.number().nullable(),
  type: z.string(),
  airdate: z.string().nullable(),
  airtime: z.string(),
  airstamp: z.string().nullable(),
  runtime: z.number().nullable(),
  rating: z.object({
    average: z.number().nullable(),
  }),
  image: ImageSchema.nullable(),
  summary: z.string().nullable(),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
    show: z.object({
      href: z.string(),
    }),
  }),
});

const SeasonSchema = z.object({
  id: z.number(),
  url: z.string(),
  number: z.number(),
  name: z.string(),
  episodeOrder: z.number().nullable(),
  premiereDate: z.string().nullable(),
  endDate: z.string().nullable(),
  network: RemoteNetworkSchema.nullable(),
  webChannel: RemoteWebChannelSchema.nullable(),
  image: ImageSchema.nullable(),
  summary: z.string().nullable(),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  _embedded: z
    .object({
      episodes: z.array(EpisodeSchema),
    })
    .optional(),
});

const SeriesSchema = z.object({
  id: z.number(),
  url: z.string().nullable(),
  name: z.string(),
  type: z.string().nullable(),
  language: z.string(),
  genres: z.array(z.string()),
  status: z.string(),
  runtime: z.number().nullable(),
  averageRuntime: z.number().nullable(),
  premiered: z.string().nullable(),
  ended: z.string().nullable(),
  officialSite: z.string().nullable(),
  schedule: z.object({
    time: z.string(),
    days: z.array(z.string()),
  }),
  rating: z.object({
    average: z.number().nullable(),
  }),
  weight: z.number(),
  network: RemoteNetworkSchema.nullable(),
  webChannel: RemoteWebChannelSchema.nullable(),
  dvdCountry: z.string().nullable(),
  externals: z.object({
    tvrage: z.number().nullable(),
    thetvdb: z.number().nullable(),
    imdb: z.string().nullable(),
  }),
  image: ImageSchema.nullable(),
  summary: z.string().nullable(),
  updated: z.number(),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
    previousepisode: z
      .object({
        href: z.string(),
        name: z.string(),
      })
      .optional(),
  }),
  _embedded: z
    .object({
      seasons: z.array(SeasonSchema),
    })
    .optional(),
});

const SearchResponseSchema = z.object({
  score: z.number(),
  show: SeriesSchema,
});

const TrackingSeriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  image: ImageSchema.nullable(),
  status: z.string(),
  premiered: z.string().nullable(),
  ended: z.string().nullable(),
  network: RemoteNetworkSchema.nullable(),
  webChannel: RemoteWebChannelSchema.nullable(),
  genres: z.array(z.string()),
  summary: z.string().nullable(),
  rating: z.object({
    average: z.number().nullable(),
  }),
  totalEpisodes: z.number(),
  watchedEpisodes: z.number(),
  isTracking: z.boolean(),
  isFavorite: z.boolean(),
  lastWatchedAt: z.string().nullable(),
  progress: z.number(),
});

const TrackingEpisodeSchema = z.object({
  isWatched: z.boolean(),
  timestamp: z.string().nullable(),
});

const TrackingSeasonSchema = z.object({
  episodes: z.record(z.string(), TrackingEpisodeSchema),
});

const TrackingSeriesDataItemSchema = z.object({
  seasons: z.record(z.string(), TrackingSeasonSchema),
});

const TrackingSeriesDataSchema = z.record(z.string(), TrackingSeriesDataItemSchema);

export const PersistedSeriesStoreSchema = z.object({
  seriesData: z.array(SeriesSchema).nullable(),
  activeSeriesId: z.number().nullable(),
  trackingSeriesMap: z.record(z.string(), z.boolean()),
  favoritesSeriesMap: z.record(z.string(), z.boolean()),
  trackingSeriesData: TrackingSeriesDataSchema.nullable(),
  isRewardShownMap: z.record(z.string(), z.boolean()),
});

export const StorageSchema = z.object({
  state: PersistedSeriesStoreSchema,
  version: z.number(),
});

export type PersistedSeriesStore = z.infer<typeof PersistedSeriesStoreSchema>;
export type StorageData = z.infer<typeof StorageSchema>;

export const ToggleEpisodeWatchedDataSchema = z.object({
  seriesId: z.string(),
  seasonId: z.string(),
  episodeId: z.string(),
  isWatched: z.boolean(),
});

export {
  EpisodeSchema,
  ImageSchema,
  RemoteCountrySchema,
  RemoteNetworkSchema,
  RemoteWebChannelSchema,
  SearchResponseSchema,
  SeasonSchema,
  SeriesSchema,
  TrackingEpisodeSchema,
  TrackingSeasonSchema,
  TrackingSeriesDataItemSchema,
  TrackingSeriesDataSchema,
  TrackingSeriesSchema,
};
