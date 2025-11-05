import { exportSeriesState, importSeriesState } from '@/utils';
import { useState } from 'react';

interface UseBackupProps {
  exportData: () => void;
  importData: () => Promise<void>;
  isImporting: boolean;
  error: string | null;
}

export const useBackup = (): UseBackupProps => {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = () => {
    setError(null);

    try {
      exportSeriesState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const importData = async () => {
    setIsImporting(true);
    setError(null);

    try {
      await importSeriesState();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return {
    exportData,
    importData,
    isImporting,
    error,
  };
};
