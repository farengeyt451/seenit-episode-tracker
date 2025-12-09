import { SupportBlock } from '@/components';
import { LockWrapper, SeenItButton, SeenitInput } from '@/components/ui';
import { useBackup } from '@/hooks';
import { useLicenseStore, useSeriesStore } from '@/store';
import { Nullable } from '@/utility-types';
import { Button, Dialog, DialogPanel, DialogTitle, Field } from '@headlessui/react';
import { BackspaceIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { ChangeEvent, FC, JSX, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';

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

  const getImportIcon = () => {
    if (isImporting) {
      return <div className="size-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
    }
    if (importErrorMessage) {
      return <ExclamationCircleIcon className="size-5 text-red-500" />;
    }
    if (isImportSuccess) {
      return <CheckCircleIcon className="size-5 text-green-400" />;
    }
    return <ArrowUpTrayIcon className="size-5 text-blue-400" />;
  };

  const getImportTitle = () => {
    if (importErrorMessage) return 'Import Failed';
    if (isImportSuccess) return 'Import Successful';
    return 'Import Backup';
  };

  const getImportDescription = () => {
    if (importErrorMessage) return importErrorMessage;
    if (isImporting) return 'Restoring data...';
    if (isImportSuccess) return 'Data restored successfully';
    return 'Restore your tracking data';
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

  return (
    <div data-tag="settings">
      {/* Settings Icon Button */}
      <Button
        data-tag="settings__button"
        onClick={handleModalOpen}
        className={clsx(
          'group rounded-lg p-1.5 transition-colors duration-150',
          'bg-gray-700 transition-colors duration-150 ease-out data-hover:bg-gray-600',
          'light:bg-blue-600 light:border light:border-slate-200 light:data-hover:bg-blue-700',
          'cursor-pointer',
        )}
        aria-label="Open settings"
        title="Settings"
      >
        <Cog6ToothIcon
          data-tag="settings__icon"
          className="size-5 duration-300 group-hover:rotate-35"
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
              'min-h-[420px]',
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

                {/* Data Management Section */}
                <section data-tag="settings__data-management">
                  <h3 className="light:text-slate-600 mt-2 text-sm font-medium text-gray-400">Data Management</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <LockWrapper>
                      <Button
                        onClick={exportData}
                        disabled={!isLicenseActivated || !activeSeriesId}
                        className={clsx(
                          'light:bg-slate-100 light:hover:bg-slate-200 flex w-full items-center justify-between rounded-lg bg-gray-700/50 p-3 transition-colors hover:bg-gray-700',
                          'disabled:pointer-events-none disabled:opacity-50',
                          'cursor-pointer',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <ArrowDownTrayIcon className="size-5 text-green-400" />
                          <div className="text-left">
                            <p className="light:text-gray-600 font-medium">Export Backup</p>
                            <p className="light:text-slate-600 text-sm text-gray-400">Save your series tracking data</p>
                          </div>
                        </div>
                        <span className="light:text-blue-600 flex items-center gap-1 text-sm font-semibold text-blue-400">
                          Export <ArrowRightIcon className="size-3" />
                        </span>
                      </Button>
                    </LockWrapper>

                    <LockWrapper>
                      <Button
                        onClick={importData}
                        disabled={!isLicenseActivated}
                        className={clsx(
                          'light:bg-slate-100 light:hover:bg-slate-200 flex w-full items-center justify-between rounded-lg bg-gray-700/50 p-3 transition-colors hover:bg-gray-700',
                          'disabled:pointer-events-none disabled:opacity-50',
                          'cursor-pointer',
                          (isImportSuccess || isImporting) && 'pointer-events-none',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {getImportIcon()}
                          <div className="text-left">
                            <p
                              className={clsx(
                                'light:text-gray-600 font-medium',
                                importErrorMessage && 'text-red-500',
                                isImportSuccess && 'text-green-400',
                              )}
                            >
                              {getImportTitle()}
                            </p>
                            <p className="light:text-slate-600 text-sm text-gray-400">{getImportDescription()}</p>
                          </div>
                        </div>
                        {!isImporting && !isImportSuccess && (
                          <span className="light:text-blue-600 flex items-center gap-1 text-sm font-semibold text-blue-400">
                            <ArrowLeftIcon className="size-3" /> {importErrorMessage ? 'Retry' : 'Import'}
                          </span>
                        )}
                      </Button>
                    </LockWrapper>
                  </div>
                </section>

                {/* Pro Features Info or Success Message */}
                <div
                  data-tag="settings__support"
                  className="mt-4"
                >
                  <SupportBlock isActivated={isLicenseActivated} />
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};
