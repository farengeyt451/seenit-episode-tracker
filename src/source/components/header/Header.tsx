import { SeenItButton, SeenitDialog, SeenitDialogHandle } from '@/components/ui';
import { Theme } from '@/enums';
import { useBackup } from '@/hooks';
import { useSeriesStore, useSidebarStore } from '@/store';
import { useThemeStore } from '@/store/useTheme';
import { Button } from '@headlessui/react';
import { ArrowLongRightIcon } from '@heroicons/react/20/solid';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { JSX, memo, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

export const Header = memo((): JSX.Element => {
  const activeSeriesId = useSeriesStore(state => state.activeSeriesId);
  const { exportData, importData, isImporting, error: backupError } = useBackup();
  const setSidebarOpenState = useSidebarStore(state => state.setSidebarOpenState);
  const { theme, setTheme } = useThemeStore(
    useShallow(state => ({
      theme: state.theme,
      setTheme: state.setTheme,
    })),
  );

  const isDarkTheme = theme === Theme.Dark;

  const handleToggleTheme = () => {
    setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light);
  };

  const handleButtonMenuClick = () => {
    setSidebarOpenState(true);
  };

  const handleExportData = () => {
    exportData();
  };

  const handleImportData = async () => {
    await importData();
  };

  const dialogRef = useRef<SeenitDialogHandle>(null);

  const setDataThemeAttr = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme ? theme : Theme.Light);
  };

  useEffect(() => {
    if (backupError) {
      dialogRef.current?.open();
    }
  }, [backupError]);

  useEffect(() => {
    setDataThemeAttr(theme);
  }, [theme]);

  return (
    <header
      data-tag="header"
      className="flex grow-1 items-center justify-between"
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
            'inline-flex cursor-pointer items-center rounded-lg',
            'bg-gray-700 p-1.5 transition-colors duration-150 ease-out data-[hover]:bg-gray-600',
            'light:bg-blue-600 light:border light:border-slate-200 light:data-[hover]:bg-blue-700',
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
        <SeenItButton
          size="small"
          onClick={handleExportData}
          disabled={!activeSeriesId}
        >
          Export
        </SeenItButton>

        <div className="relative">
          <SeenItButton
            onClick={handleImportData}
            disabled={isImporting}
            size="small"
          >
            <span className={clsx(isImporting && 'opacity-30')}>Import</span>
          </SeenItButton>

          {isImporting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="light:border-white light:border-t-transparent size-4 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
            </div>
          )}
        </div>

        <Button
          data-tag="header__action-theme"
          className="relative flex size-7 cursor-pointer items-center justify-center rounded-full text-xl"
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
      </div>

      <SeenitDialog
        ref={dialogRef}
        title="Something went wrong"
        isAlert={true}
        description={backupError!}
      ></SeenitDialog>
    </header>
  );
});

Header.displayName = 'HeaderComponent';
