import { ACTIVATE_LICENSE, CHECK_LICENSE, SEASONS_ENDPOINT } from '@/constants';
import {
  ActivateLicenseKeyRequest,
  ActivateLicenseResponse,
  FetchSeriesMetadataOptions,
  isActivateLicenseSuccess,
  Series,
} from '@/types';
import axios from 'axios';

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
 * Common function to handle license requests
 */
const handleLicenseRequest = async (
  endpoint: string,
  { licenseKey, signal, onSuccess, onError, onFinally }: ActivateLicenseKeyRequest,
): Promise<void> => {
  try {
    const { data } = await axios.post<ActivateLicenseResponse>(endpoint, { licenseKey }, { signal });

    if (isActivateLicenseSuccess(data)) {
      onSuccess(data);
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error || err.message || 'Failed to process license request';
      onError(errorMessage);
    } else {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process license request';
      onError(errorMessage);
    }
  } finally {
    onFinally?.();
  }
};

/**
 * Activate license
 */
export const activateLicense = async (options: ActivateLicenseKeyRequest): Promise<void> => {
  return handleLicenseRequest(ACTIVATE_LICENSE, options);
};

/**
 * Check current license
 */
export const checkLicense = async (options: ActivateLicenseKeyRequest): Promise<void> => {
  return handleLicenseRequest(CHECK_LICENSE, options);
};
