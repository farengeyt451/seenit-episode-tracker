import { ACTIVATE_LICENSE, SEASONS_ENDPOINT } from '@/constants';
import { Series } from '@/types';
import axios from 'axios';

interface BaseFetchOptions {
  signal?: AbortSignal;
  onError: (error: string) => void;
  onFinally?: () => void;
}

interface FetchSeriesMetadataOptions extends BaseFetchOptions {
  id: number;
  delay?: number;
  onSuccess: (data: Series) => void; // Keep Series for metadata
}

interface LicenseKeyRequest extends BaseFetchOptions {
  licenseKey: string;
  onSuccess: (data: { message: string }) => void; // Specific type for license response
}

/**
 * Fetches series metadata from the server
 */
export const fetchSeriesMetadata = async ({
  id,
  signal,
  delay,
  onSuccess,
  onError,
  onFinally,
}: FetchSeriesMetadataOptions): Promise<void> => {
  try {
    const { data } = await axios.get<Series>(SEASONS_ENDPOINT.replace('{id}', String(id)), {
      signal,
    });
    setTimeout(() => {
      onSuccess(data);
      onFinally?.();
    }, delay ?? 0);
  } catch (err: unknown) {
    if (axios.isCancel(err)) {
      onFinally?.();
      return;
    }

    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';

    onError(errorMessage);
    onFinally?.();
  }
};

/**
 * Activate license
 */
export const activateLicense = async ({
  licenseKey,
  signal,
  onSuccess,
  onError,
  onFinally,
}: LicenseKeyRequest): Promise<void> => {
  try {
    const { data } = await axios.post(
      ACTIVATE_LICENSE,
      {
        licenseKey,
      },
      {
        signal,
      },
    );

    if (data) onSuccess(data);
    onFinally?.();
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error || err.message || 'Failed to activate license';
      onError(errorMessage);
    } else {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate license';
      onError(errorMessage);
    }

    onFinally?.();
  }
};
