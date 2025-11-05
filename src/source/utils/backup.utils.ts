import { SERIES_STORAGE_NAME } from '@/constants';
import { useSeriesStore } from '@/store';
import { StorageSchema } from '@/zod-schemas';
import { getBackupTime } from './time.utils';
import { chromeStorage } from './storage.utils';

const readBackupFile = (file: Blob, resolve: () => void, reject: (err: Error) => void): void => {
  const reader = new FileReader();

  reader.onload = async event => {
    try {
      const result = event.target?.result;

      if (typeof result !== 'string') {
        reject(new Error('Failed to read file as text'));
        return;
      }

      const raw = result;
      const parsed = JSON.parse(raw);

      const zodResult = StorageSchema.safeParse(parsed);

      if (zodResult.error) {
        reject(new Error('Invalid backup file format - data structure mismatch'));
        return;
      }

      const store = useSeriesStore.persist;

      if (!store) return;

      chromeStorage.setItem(SERIES_STORAGE_NAME, raw);

      await store.rehydrate();

      resolve();
    } catch {
      reject(new Error('Failed to read backup file'));
    }
  };

  reader.onerror = () => {
    reject(new Error('Failed to read backup file'));
  };

  reader.readAsText(file, 'utf-8');
};

/**
 * Export data from store to external file
 * Sync
 */
export const exportSeriesState = async (): Promise<void> => {
  try {
    const rawData = await chromeStorage.getItem(SERIES_STORAGE_NAME);

    if (!rawData) return;

    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = getBackupTime();

    link.href = url;
    link.download = `${timestamp}_seenit-backup.json`;
    link.click();

    URL.revokeObjectURL(link.href);
  } catch {
    throw new Error('Export failed');
  }
};

/**
 * Import data from external file to the chromeStorage
 * Rehydrate store
 * Async
 */
export const importSeriesState = (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.json';

    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (!file) {
        reject(new Error('File is not found'));
        return;
      }

      readBackupFile(file, resolve, reject);
    };

    input.click();

    input.oncancel = () => {
      resolve();
    };
  });
};
