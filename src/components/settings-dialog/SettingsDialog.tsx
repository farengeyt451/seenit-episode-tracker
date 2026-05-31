import { LockWrapper, SeenItButton, SeenitInput } from '@/components/ui';
import { SyncStatus } from '@/enums';
import { useBackup } from '@/hooks';
import { useLicenseStore, useSeriesStore, useSyncStore } from '@/store';
import { Nullable } from '@/utility-types';
import { Button, Dialog, DialogPanel, DialogTitle, Field } from '@headlessui/react';
import { BackspaceIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { DateTime } from 'luxon';
import { ChangeEvent, FC, JSX, ReactNode, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';

type SettingRowStatus = 'default' | 'loading' | 'success' | 'error';

const ROW_CONTAINER_CLASS = 'light:bg-slate-100 flex w-full items-center justify-between rounded-lg bg-gray-700/50 p-3';

const ROW_BUTTON_CLASS = clsx(
  ROW_CONTAINER_CLASS,
  'light:hover:bg-slate-200 cursor-pointer transition-colors hover:bg-gray-700',
  'disabled:pointer-events-none disabled:opacity-50',
);

const ROW_DESCRIPTION_COLOR: Record<SettingRowStatus, string> = {
  default: 'text-gray-400',
  loading: 'text-gray-400',
  success: 'text-green-400',
  error: 'text-red-400',
};

const Spinner: FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('shrink-0 animate-spin rounded-full border-2 border-t-transparent', className)} />
);

const renderStatusIcon = (status: SettingRowStatus, idleIcon: ReactNode): ReactNode => {
  switch (status) {
    case 'loading':
      return <Spinner className="size-5 border-blue-400" />;
    case 'success':
      return <CheckCircleIcon className="size-5 shrink-0 text-green-400" />;
    case 'error':
      return <ExclamationCircleIcon className="size-6 shrink-0 text-red-500" />;
    default:
      return idleIcon;
  }
};

interface SettingRowContentProps {
  icon: ReactNode;
  title: string;
  description: string;
  status?: SettingRowStatus;
  dataTag?: string;
}

const SettingRowContent: FC<SettingRowContentProps> = ({ icon, title, description, status = 'default', dataTag }) => (
  <div
    data-tag={dataTag}
    className="flex min-w-0 items-center gap-3"
  >
    {icon}
    <div className="min-w-0 text-left">
      <p className="light:text-gray-600 font-medium text-gray-100">{title}</p>
      <p className={clsx('light:text-slate-600 truncate text-sm', ROW_DESCRIPTION_COLOR[status])}>{description}</p>
    </div>
  </div>
);

export const SettingsDialog: FC = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [licenseKey, setLicenseKey] = useState<string>('');

  const abortControllerRef = useRef<Nullable<AbortController>>(null);

  const {
    exportData,
    importData,
    isImporting,
    importErrorMessage,
    isImportSuccess,
    clearImportErrorMessage,
    clearImportSuccessMessage,
  } = useBackup();

  const activeSeriesId = useSeriesStore(state => state.activeSeriesId);

  const { syncStatus, isConnected, lastSyncedAt, syncError, connect, disconnect, syncNow } = useSyncStore(
    useShallow(state => ({
      syncStatus: state.status,
      isConnected: state.isConnected,
      lastSyncedAt: state.lastSyncedAt,
      syncError: state.error,
      connect: state.connect,
      disconnect: state.disconnect,
      syncNow: state.syncNow,
    })),
  );

  const {
    isLicenseActivating,
    isLicenseActivated,
    activateLicenseErrorMessage,
    activateLicense,
    clearLicenseActivationState,
  } = useLicenseStore(
    useShallow(state => ({
      isLicenseActivating: state.isLicenseActivating,
      isLicenseChecking: state.isLicenseChecking,
      isLicenseChecked: state.isLicenseChecked,
      isLicenseActivated: state.isLicenseActivated,
      activateLicenseErrorMessage: state.activateLicenseErrorMessage,
      activateLicense: state.activateLicense,
      clearLicenseActivationState: state.clearLicenseActivationState,
    })),
  );

  const getImportStatus = (): SettingRowStatus => {
    if (isImporting) return 'loading';
    if (importErrorMessage) return 'error';
    if (isImportSuccess) return 'success';
    return 'default';
  };

  const getImportTitle = (): string => {
    if (importErrorMessage) return 'Import Failed';
    if (isImportSuccess) return 'Import Successful';
    return 'Import Backup';
  };

  const getImportDescription = (): string => {
    if (importErrorMessage) return importErrorMessage;
    if (isImporting) return 'Restoring data...';
    if (isImportSuccess) return 'Data restored successfully';
    return 'Restore your tracking data';
  };

  const getSyncStatus = (): SettingRowStatus => {
    if (syncStatus === SyncStatus.Syncing) return 'loading';
    if (syncStatus === SyncStatus.Error) return 'error';
    if (isConnected) return 'success';
    return 'default';
  };

  const getSyncDescription = (): string => {
    if (syncStatus === SyncStatus.Syncing) return 'Syncing...';
    if (syncStatus === SyncStatus.Error) {
      return isConnected && syncError ? syncError : 'Failed to connect. Please try again.';
    }
    if (isConnected) return formatLastSynced();
    return 'Sync your data across devices';
  };

  const formatLastSynced = (): string => {
    if (!lastSyncedAt) return 'Never synced';
    const relative = DateTime.fromISO(lastSyncedAt).toRelative({ style: 'short' });

    return relative ? `Last synced ${relative}` : 'Synced recently';
  };

  const handleModalOpen = () => {
    setIsOpen(true);
    clearImportErrorMessage();
    clearImportSuccessMessage();
    clearLicenseActivationState();
    handleLicenseInputClear();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLicenseKey(event.target.value);
  };

  const handleLicenseInputClear = () => {
    setLicenseKey('');
    clearLicenseActivationState();
  };

  const handleLicenseSubmission = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    activateLicense(licenseKey, controller.signal);
  };

  const syncRowStatus = getSyncStatus();
  const importRowStatus = getImportStatus();

  return (
    <div data-tag="settings">
      <Button
        data-tag="settings__button"
        onClick={handleModalOpen}
        className={clsx(
          'group relative flex size-7 cursor-pointer items-center justify-center rounded-full',
          'disabled:pointer-events-none',
        )}
        aria-label="Open settings"
        title="Settings"
      >
        <Cog6ToothIcon
          data-tag="settings__icon"
          className={clsx(
            'size-6 transition-all duration-300 ease-out',
            'text-gray-300 group-hover:rotate-45 group-hover:text-white',
            'light:text-slate-600 light:group-hover:text-slate-900',
          )}
        />
      </Button>

      {/* Settings Dialog */}
      <Dialog
        data-tag="settings__dialog"
        open={isOpen}
        as="div"
        className={clsx(
          'absolute inset-0 z-30 focus:outline-none',
          'bg-black/30 transition-opacity duration-300 ease-out',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClose={() => setIsOpen(false)}
      >
        <div
          data-tag="settings__content"
          className="relative top-[50%] left-[50%] z-50 flex w-[90%] -translate-x-2/4 -translate-y-2/4 items-center justify-center"
        >
          <DialogPanel
            transition
            className={clsx(
              'light:bg-gray-300 relative w-full rounded-xl bg-gray-800 p-6 shadow-xl',
              'min-h-105',
              'duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0',
              'overflow-hidden',
            )}
          >
            {/* Decorative Background Gradient */}
            <div
              className={clsx(
                'pointer-events-none absolute -top-20 -right-20 size-64 rounded-full opacity-5',
                'bg-linear-to-br from-blue-500 to-purple-600',
                'light:from-blue-400 light:to-indigo-500',
                'blur-3xl',
              )}
            />
            <div
              className={clsx(
                'pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full opacity-5',
                'bg-linear-to-tr from-green-500 to-blue-500',
                'light:from-green-400 light:to-blue-400',
                'blur-3xl',
              )}
            />

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div
                data-tag="settings__header"
                className="flex items-center justify-between"
              >
                <DialogTitle
                  as="h3"
                  className="light:text-slate-900 cursor-default text-xl font-semibold text-gray-100"
                >
                  Settings & Preferences
                </DialogTitle>
                <Button
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    'inline-flex items-center',
                    'rounded-lg p-1.5',
                    'text-sm text-gray-400',
                    'bg-transparent',
                    'cursor-pointer',
                    'transition-colors duration-150 ease-out',
                    'data-hover:bg-gray-700 data-hover:text-white',
                    'light:text-slate-700 light:data-hover:bg-blue-600 light:data-hover:text-slate-100',
                  )}
                  aria-label="Close settings"
                >
                  <XMarkIcon className="size-5" />
                </Button>
              </div>

              {/* Settings Sections */}
              <div
                data-tag="settings__sections"
                className="mt-6"
              >
                {/* License Key Section */}
                {!isLicenseActivated && (
                  <section data-tag="settings__license-key">
                    <h3 className="light:text-slate-600 text-sm font-medium text-gray-400">License key</h3>

                    <div className="relative mt-3 pb-6">
                      <div className="flex justify-between gap-2">
                        <Field
                          data-tag="search"
                          className="relative w-full"
                        >
                          <SeenitInput
                            data-tag="settings__license-input"
                            type="text"
                            placeholder="Enter License Key"
                            value={licenseKey}
                            className="relative"
                            onChange={handleInputChange}
                          />

                          {licenseKey && !isLicenseActivating && (
                            <Button
                              data-tag="search__clear"
                              type="button"
                              className={clsx(
                                'absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer',
                                'text-gray-300 hover:text-gray-200',
                                'transition-all duration-200 ease-out',
                                'after:absolute after:top-[-25%] after:left-[-25%] after:h-[150%] after:w-[150%]',
                                'scale-100 rotate-0 opacity-100',
                                'light:text-slate-600 light:hover:text-slate-900',
                              )}
                              onClick={handleLicenseInputClear}
                            >
                              <BackspaceIcon className="size-5" />
                              <span className="sr-only">Clear input</span>
                            </Button>
                          )}

                          {isLicenseActivating && (
                            <div
                              data-tag="search__loader"
                              className={clsx(
                                'pointer-events-none absolute top-1/2 right-3.5 inline-block size-4 -translate-y-1/2',
                                'animate-spin rounded-full border-3 border-blue-500 border-t-transparent',
                              )}
                              role="status"
                              aria-label="loading"
                            >
                              <span className="sr-only">Loading...</span>
                            </div>
                          )}
                        </Field>

                        <SeenItButton
                          disabled={!licenseKey || isLicenseActivating}
                          colorType="primary"
                          size="small"
                          onClick={handleLicenseSubmission}
                        >
                          Submit
                        </SeenItButton>
                      </div>

                      {activateLicenseErrorMessage && (
                        <div
                          className={clsx('absolute bottom-0 flex items-center gap-2')}
                          role="alert"
                        >
                          <div className="light:text-red-600 mt-0.5 size-3 shrink-0 rounded-full bg-red-500"></div>
                          <p className="light:text-red-600 text-sm text-red-500">{activateLicenseErrorMessage}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Cloud Sync Section */}
                <section
                  data-tag="settings__cloud-sync"
                  className="mt-2"
                >
                  <h3 className="light:text-slate-600 text-sm font-medium text-gray-400">Cloud Sync</h3>

                  <div className="mt-3">
                    <div
                      data-tag="settings__cloud-sync-row"
                      className={ROW_CONTAINER_CLASS}
                    >
                      <SettingRowContent
                        dataTag="settings__cloud-sync-info"
                        icon={renderStatusIcon(
                          syncRowStatus,
                          <CloudArrowUpIcon className="size-5 shrink-0 text-blue-400" />,
                        )}
                        title="Google Drive"
                        description={getSyncDescription()}
                        status={syncRowStatus}
                      />

                      {isConnected ? (
                        <div className="flex items-center gap-2">
                          <SeenItButton
                            data-tag="settings__cloud-sync-sync"
                            colorType="primary"
                            size="small"
                            disabled={syncStatus === SyncStatus.Syncing}
                            onClick={syncNow}
                          >
                            Sync
                          </SeenItButton>
                          <SeenItButton
                            data-tag="settings__cloud-sync-disconnect"
                            colorType="secondary"
                            size="small"
                            onClick={disconnect}
                          >
                            Disconnect
                          </SeenItButton>
                        </div>
                      ) : (
                        <SeenItButton
                          data-tag="settings__cloud-sync-connect"
                          colorType="primary"
                          size="small"
                          disabled={syncStatus === SyncStatus.Syncing}
                          onClick={connect}
                        >
                          {syncStatus === SyncStatus.Syncing ? <Spinner className="size-4 border-white" /> : 'Connect'}
                        </SeenItButton>
                      )}
                    </div>
                  </div>
                </section>

                {/* Data Management Section */}
                <section data-tag="settings__data-management">
                  <h3 className="light:text-slate-600 mt-2 text-sm font-medium text-gray-400">Data Management</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <LockWrapper>
                      <Button
                        data-tag="settings__data-export"
                        onClick={exportData}
                        disabled={!isLicenseActivated || !activeSeriesId}
                        className={ROW_BUTTON_CLASS}
                      >
                        <SettingRowContent
                          dataTag="settings__data-export-info"
                          icon={<ArrowDownTrayIcon className="size-5 shrink-0 text-green-400" />}
                          title="Export Backup"
                          description="Save your series tracking data"
                        />
                        <span className="light:text-blue-600 flex items-center gap-1 text-sm font-semibold text-blue-400">
                          Export <ArrowRightIcon className="size-3" />
                        </span>
                      </Button>
                    </LockWrapper>

                    <LockWrapper>
                      <Button
                        data-tag="settings__data-import"
                        onClick={importData}
                        disabled={!isLicenseActivated}
                        className={clsx(ROW_BUTTON_CLASS, (isImportSuccess || isImporting) && 'pointer-events-none')}
                      >
                        <SettingRowContent
                          dataTag="settings__data-import-info"
                          icon={renderStatusIcon(
                            importRowStatus,
                            <ArrowUpTrayIcon className="size-5 shrink-0 text-blue-400" />,
                          )}
                          title={getImportTitle()}
                          description={getImportDescription()}
                          status={importRowStatus}
                        />
                        {!isImporting && !isImportSuccess && (
                          <span className="light:text-blue-600 flex items-center gap-1 text-sm font-semibold text-blue-400">
                            <ArrowLeftIcon className="size-3" /> {importErrorMessage ? 'Retry' : 'Import'}
                          </span>
                        )}
                      </Button>
                    </LockWrapper>
                  </div>
                </section>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};
