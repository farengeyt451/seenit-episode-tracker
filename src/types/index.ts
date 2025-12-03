import { SeriesStatus } from '@/enums';
import { Nillable, Nullable } from '@/utility-types';

export interface Image {
  medium: string;
  original: string;
}

export interface RemoteCountry {
  name: string;
  code: string;
  timezone: string;
}

export interface RemoteNetwork {
  id: number;
  name: string;
  country: Nullable<RemoteCountry>;
  officialSite: Nullable<string>;
}

export interface RemoteWebChannel {
  id: number;
  name: string;
  country: Nullable<RemoteCountry>;
  officialSite: Nullable<string>;
}

export interface SearchResponse {
  score: number;
  show: Series;
}

export interface Season {
  id: number;
  url: string;
  number: number;
  name: string;
  episodeOrder?: number;
  premiereDate?: string;
  endDate?: string;
  network: Nullable<RemoteNetwork>;
  webChannel: Nullable<RemoteWebChannel>;
  image: Nullable<Image>;
  summary: Nullable<string>;
  _links: {
    self: {
      href: string;
    };
  };
}

export interface Series {
  id: number;
  url: Nillable<string>;
  name: string;
  type: Nillable<string>;
  language: string;
  genres: string[];
  status: SeriesStatus;
  runtime: Nullable<number>;
  averageRuntime: Nullable<number>;
  premiered: Nullable<string>;
  ended: Nullable<string>;
  officialSite: Nullable<string>;
  schedule: {
    time: string;
    days: string[];
  };
  rating: {
    average: Nullable<number>;
  };
  weight: number;
  network: Nullable<RemoteNetwork>;
  webChannel: Nullable<RemoteWebChannel>;
  dvdCountry: Nullable<string>;
  externals: {
    tvrage: Nullable<number>;
    thetvdb: Nullable<number>;
    imdb: Nullable<string>;
  };
  image: Nullable<Image>;
  summary: Nullable<string>;
  updated: number;
  _links: {
    self: {
      href: string;
    };
    previousepisode?: {
      href: string;
      name: string;
    };
  };
  _embedded?: {
    seasons: Season[];
  };
}

export interface TrackingEpisode {
  id: string;
  number: number;
  isWatched: boolean;
  timestamp: Nullable<string>;
}

export interface TrackingSeason {
  id: number;
  number: number;
  episodes: Record<string, TrackingEpisode>;
}

export interface TrackingSeries {
  id: Nullable<number>;
  name: string;
  status: Nullable<SeriesStatus>;
  seasons: Nullable<Record<string, TrackingSeason>>;
}

export interface TrackingSeriesData {
  [seriesId: string]: TrackingSeries;
}

export interface BaseFetchOptions {
  signal?: AbortSignal;
  onError: (error: string) => void;
  onFinally?: () => void;
}

export interface FetchSeriesMetadataOptions extends BaseFetchOptions {
  id: number;
  delay?: number;
  onSuccess: (data: Series) => void;
}

export interface ActivateLicenseKeyRequest extends BaseFetchOptions {
  licenseKey: string;
  onSuccess: (data: { message: string }) => void;
}

export type ActivateLicenseResponse = { message: string } | { error: string };

export const isActivateLicenseSuccess = (resp: ActivateLicenseResponse): resp is { message: string } =>
  (resp as { message: string }).message !== undefined;

export const isActivateLicenseError = (resp: ActivateLicenseResponse): resp is { error: string } =>
  (resp as { error: string }).error !== undefined;
