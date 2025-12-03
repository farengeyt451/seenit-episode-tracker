import { ImportFileResult } from '@/enums/ImportFileResult';
import { Nullable } from '@/utility-types';
import { exportSeriesState, importSeriesState } from '@/utils';
import { useState } from 'react';

interface UseBackupProps {
  exportData: () => void;
  importData: () => Promise<void>;
  isImporting: boolean;
  importErrorMessage: Nullable<string>;
  isImportSuccess: boolean;
  clearImportErrorMessage: () => void;
  clearImportSuccessMessage: () => void;
}

export const useBackup = (): UseBackupProps => {
  const [isImporting, setIsImporting] = useState(false);
  const [importErrorMessage, setImportErrorMessage] = useState<Nullable<string>>(null);
  const [isImportSuccess, setIsImportSuccess] = useState(false);

  const clearImportErrorMessage = () => {
    setImportErrorMessage(null);
  };

  const clearImportSuccessMessage = () => {
    setIsImportSuccess(false);
  };

  const exportData = async () => {
    setImportErrorMessage(null);

    try {
      await exportSeriesState();
    } catch (err) {
      setImportErrorMessage(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const importData = async () => {
    setIsImporting(true);
    setImportErrorMessage(null);
    setIsImportSuccess(false);

    try {
      const result = await importSeriesState();

      if (result === ImportFileResult.Success) {
        setIsImportSuccess(true);
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'User cancelled') {
        setImportErrorMessage(err.message);
      }
    } finally {
      setIsImporting(false);
    }
  };

  return {
    exportData,
    importData,
    isImporting,
    importErrorMessage,
    isImportSuccess,
    clearImportErrorMessage,
    clearImportSuccessMessage,
  };
};
