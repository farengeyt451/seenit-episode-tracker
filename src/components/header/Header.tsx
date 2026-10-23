import { SettingsDialog } from '@/components';
import { LockWrapper, SupportLink } from '@/components/ui';
import { SyncPhase, SyncStatus, Theme } from '@/enums';
import { useLicenseStore, useSidebarStore, useSyncStore, useThemeStore } from '@/store';
import { Button } from '@headlessui/react';
import { ArrowLongRightIcon } from '@heroicons/react/20/solid';
import { CloudArrowDownIcon, CloudArrowUpIcon, CloudIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { JSX, memo, useEffect } from 'react';
import { useShallow } from 'zustand/shallow';

export const Header = memo((): JSX.Element => {
  const setSidebarOpenState = useSidebarStore(state => state.setSidebarOpenState);

  const { theme, setTheme } = useThemeStore(
    useShallow(state => ({
      theme: state.theme,
      setTheme: state.setTheme,
    })),
  );

  const isLicenseActivated = useLicenseStore(state => state.isLicenseActivated);

  const { isConnected, syncPhase, syncStatus, syncNow } = useSyncStore(
    useShallow(state => ({
      isConnected: state.isConnected,
      syncPhase: state.phase,
      syncStatus: state.status,
      syncNow: state.syncNow,
    })),
  );

  const isDarkTheme = theme === Theme.Dark;
  const isPulling = syncPhase === SyncPhase.Pulling;
  const isPushing = syncPhase === SyncPhase.Pushing;
  const isCloudIdle = syncPhase === SyncPhase.Idle;
  const isSynced = isConnected && isCloudIdle && syncStatus === SyncStatus.Success;
  const showIdleCloud = isCloudIdle && !isSynced;

  const handleToggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const handleCloudSync = () => {
    if (!isConnected) return;
    syncNow();
  };

  const getCloudButtonLabel = (): string => {
    if (!isConnected) return 'Cloud sync — not connected';
    if (isPulling) return 'Pulling changes from Google Drive';
    if (isPushing) return 'Pushing changes to Google Drive';
    if (isSynced) return 'Synced with Google Drive';
    return 'Sync with Google Drive';
  };

  const cloudButtonLabel = getCloudButtonLabel();

  const handleButtonMenuClick = () => {
    setSidebarOpenState(true);
  };

  const setDataThemeAttr = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme ? theme : Theme.Light);
  };

  useEffect(() => {
    setDataThemeAttr(theme);
  }, [theme]);

  return (
    <header
      data-tag="header"
      className="flex grow items-center justify-between"
    >
      <div
        data-tag="header__left-group"
        className="flex gap-4"
      >
        <Button
          type="button"
          data-tag="header__button-menu"
          data-drawer-show="drawer-navigation"
          aria-controls="drawer-navigation"
          className={clsx(
            'group inline-flex cursor-pointer items-center rounded-lg',
            'bg-gray-700 p-1.5 transition-colors duration-150 ease-out data-hover:bg-gray-600',
            'light:bg-blue-600 light:border light:border-slate-200 light:data-hover:bg-blue-700',
          )}
          onClick={handleButtonMenuClick}
        >
          <ArrowLongRightIcon
            data-tag="header__icon-open"
            aria-hidden="true"
            className="size-5 text-white transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          />
          <span className="sr-only">Open menu</span>
        </Button>

        <h1
          data-tag="header__caption"
          className={clsx(
            'seenit-animated-title light:text-slate-900 cursor-default text-[1.375rem] font-bold text-gray-200',
          )}
        >
          Seenit!
        </h1>
      </div>

      <div
        data-tag="header__right-group"
        className="flex items-center gap-2"
      >
        {!isLicenseActivated && (
          <div data-tag="header__support">
            <SupportLink />
          </div>
        )}

        {isConnected && (
          <div data-tag="header__cloud">
            <Button
              data-tag="header__action-cloud"
              className={clsx(
                'relative flex size-7 items-center justify-center rounded-full text-xl',
                'cursor-pointer disabled:pointer-events-none disabled:cursor-default',
              )}
              disabled={syncPhase !== SyncPhase.Idle}
              aria-label={cloudButtonLabel}
              title={cloudButtonLabel}
              onClick={handleCloudSync}
            >
              <CloudIcon
                data-tag="header__icon-cloud-idle"
                aria-hidden="true"
                className={clsx(
                  'absolute size-6 transition-all duration-300 ease-out',
                  'light:text-sky-600 light:hover:text-sky-700 text-sky-400 hover:text-sky-300',
                  showIdleCloud ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-12 opacity-0',
                )}
              />

              <div
                data-tag="header__cloud-synced"
                className={clsx(
                  'absolute size-6 transition-all duration-300 ease-out',
                  isSynced ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
                )}
              >
                <CloudIcon
                  data-tag="header__icon-cloud-synced"
                  aria-hidden="true"
                  className={clsx('absolute size-6', 'text-emerald-600', isSynced && 'animate-cloud-check')}
                />
                <svg
                  data-tag="header__icon-check"
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={clsx(
                    'absolute top-[calc(50%+1px)] left-[50%] size-3 -translate-x-2/4 -translate-y-2/4',
                    'text-white',
                    isSynced && 'animate-cloud-check',
                  )}
                >
                  <path d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>

              <div
                data-tag="header__cloud-pull"
                className={clsx(
                  'absolute size-6 transition-all duration-300 ease-out',
                  isPulling ? 'animate-cloud-pull scale-100 opacity-100' : 'scale-75 opacity-0',
                )}
              >
                <CloudIcon
                  data-tag="header__icon-cloud-pull-arrow"
                  aria-hidden="true"
                  className="absolute size-6 text-white"
                />
                <CloudArrowDownIcon
                  data-tag="header__icon-cloud-pull"
                  aria-hidden="true"
                  className="si absolute size-7 text-sky-600"
                />
              </div>

              <div
                data-tag="header__cloud-push"
                className={clsx(
                  'absolute size-6 transition-all duration-300 ease-out',
                  isPushing ? 'animate-cloud-push scale-100 opacity-100' : 'scale-75 opacity-0',
                )}
              >
                <CloudIcon
                  data-tag="header__icon-cloud-push-arrow"
                  aria-hidden="true"
                  className="absolute size-6 text-white"
                />
                <CloudArrowUpIcon
                  data-tag="header__icon-cloud-push"
                  aria-hidden="true"
                  className="absolute size-7 text-sky-600"
                />
              </div>
            </Button>
          </div>
        )}

        <div data-tag="header__settings">
          <SettingsDialog />
        </div>

        <LockWrapper>
          <Button
            data-tag="header__action-theme"
            className={clsx(
              'relative flex size-7 items-center justify-center rounded-full text-xl',
              'cursor-pointer disabled:pointer-events-none',
            )}
            disabled={!isLicenseActivated}
            aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={handleToggleTheme}
          >
            <MoonIcon
              data-tag="header__icon-dark"
              className={clsx(
                'absolute size-6 transition-all duration-200 ease-out',
                isDarkTheme
                  ? 'scale-100 rotate-0 text-blue-500 opacity-100 hover:text-blue-400'
                  : 'scale-50 -rotate-90 text-blue-500 opacity-0',
              )}
            />
            <SunIcon
              data-tag="header__icon-light"
              className={clsx(
                'absolute size-6.5 transition-all duration-200 ease-out',
                isDarkTheme
                  ? 'scale-50 rotate-90 text-amber-600 opacity-0'
                  : 'scale-100 rotate-0 text-amber-600 opacity-100 hover:text-amber-700',
              )}
            />
          </Button>
        </LockWrapper>
      </div>
    </header>
  );
});

Header.displayName = 'HeaderComponent';
