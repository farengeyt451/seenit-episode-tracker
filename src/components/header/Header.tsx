import { SettingsDialog } from '@/components';
import { LockWrapper, SupportLink } from '@/components/ui';
import { SyncPhase, Theme } from '@/enums';
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

  const { isConnected, syncPhase, syncNow } = useSyncStore(
    useShallow(state => ({
      isConnected: state.isConnected,
      syncPhase: state.phase,
      syncNow: state.syncNow,
    })),
  );

  const isDarkTheme = theme === Theme.Dark;
  const isPulling = syncPhase === SyncPhase.Pulling;
  const isPushing = syncPhase === SyncPhase.Pushing;
  const isCloudIdle = syncPhase === SyncPhase.Idle;

  const handleToggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const handleCloudSync = () => {
    if (!isConnected) return;
    syncNow();
  };

  const cloudButtonLabel = !isConnected
    ? 'Cloud sync — not connected'
    : isPulling
      ? 'Pulling changes from Google Drive'
      : isPushing
        ? 'Pushing changes to Google Drive'
        : 'Sync with Google Drive';

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
                  isCloudIdle ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-12 opacity-0',
                  isConnected
                    ? 'light:text-sky-600 light:hover:text-sky-700 text-sky-400 hover:text-sky-300'
                    : 'light:text-slate-400 text-gray-500',
                )}
              />

              <CloudArrowDownIcon
                data-tag="header__icon-cloud-pull"
                aria-hidden="true"
                className={clsx(
                  'absolute size-6 transition-all duration-300 ease-out',
                  'light:text-sky-600 text-sky-400',
                  isPulling ? 'animate-cloud-pull scale-100 opacity-100' : 'scale-75 opacity-0',
                )}
              />

              <CloudArrowUpIcon
                data-tag="header__icon-cloud-push"
                aria-hidden="true"
                className={clsx(
                  'absolute size-6 transition-all duration-300 ease-out',
                  'light:text-sky-600 text-sky-400',
                  isPushing ? 'animate-cloud-push scale-100 opacity-100' : 'scale-75 opacity-0',
                )}
              />
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
