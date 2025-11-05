import { SearchResults, SeriesList } from '@/components';
import { Filter } from '@/components/filter';
import { Search } from '@/components/search';
import { SidebarModeSwitch } from '@/components/sidebar-mode-switch';
import { ErrorTVIcon, InfoSearchBlock, SeenItButton } from '@/components/ui';
import { KeyboardKey } from '@/enums';
import { useKeyDown } from '@/hooks';
import { useFilterStore, useSearchStore, useSeriesStore, useSidebarStore } from '@/store';
import { Nullable } from '@/utility-types';
import { Button, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { FC, JSX, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { SidebarFavoritesToggle } from './SidebarFavoritesToggle';

export const Sidebar: FC = (): JSX.Element => {
  const { isSidebarOpen, setSidebarOpenState, isFilterByFavorite, toggleFilterByFavorite } = useSidebarStore(
    useShallow(state => ({
      isSidebarOpen: state.isSidebarOpen,
      setSidebarOpenState: state.setSidebarOpenState,
      isFilterByFavorite: state.isFilterByFavorite,
      toggleFilterByFavorite: state.toggleFilterByFavorite,
    })),
  );

  const { activeSeriesId, setActiveSeriesId, seriesData, fetchSeries, fetchSeriesError, clearErrorState } =
    useSeriesStore(
      useShallow(state => ({
        activeSeriesId: state.activeSeriesId,
        setActiveSeriesId: state.setActiveSeriesId,
        seriesData: state.seriesData,
        fetchSeries: state.fetchSeries,
        fetchSeriesError: state.error,
        clearErrorState: state.clearErrorState,
      })),
    );

  const clearSearch = useSearchStore(state => state.clearSearch);
  const clearFilterQuery = useFilterStore(state => state.clearFilterQuery);

  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const abortControllerRef = useRef<Nullable<AbortController>>(null);

  const handleSearchItemClick = (id: number) => {
    fetchSeriesData(id);
  };

  const closeSidebar = () => {
    setSidebarOpenState(false);
  };

  const handleSearchModeChange = (isSearchMode: boolean) => {
    setIsSearchMode(isSearchMode);
    clearSearch();
    clearFilterQuery();
  };

  const handleTryAgain = () => {
    clearSearch();
    clearErrorState();
  };

  const fetchSeriesData = async (id: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await fetchSeries(id, controller.signal);

    const hasError = useSeriesStore.getState().error;

    if (hasError) return;

    if (!activeSeriesId) {
      setActiveSeriesId(id);
    }

    setIsSearchMode(false);
  };

  useKeyDown(KeyboardKey.Escape, closeSidebar);

  useEffect(() => {
    if (isSidebarOpen && !seriesData?.length) {
      setIsSearchMode(true);
    }
  }, [isSidebarOpen, seriesData]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div data-tag="sidebar">
      {/* Overlay */}
      <div
        data-tag="sidebar__overlay"
        className={clsx(
          'light:bg-slate-900/20 absolute inset-0 z-10 bg-black/30 transition-opacity duration-300 ease-out',
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div
        id="drawer-navigation"
        aria-labelledby="drawer-navigation-label"
        data-tag="sidebar__container"
        className={clsx(
          'absolute top-0 left-0 h-full w-(--spacing-sidebar-width)',
          'scrollbar-gutter-both-edges z-20 overflow-x-hidden overflow-y-auto [scrollbar-width:thin]',
          'transition-transform duration-200 ease-out',
          'light:bg-slate-200 light:border-r light:border-slate-200 bg-gray-800',

          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        tabIndex={isSidebarOpen ? 0 : -1}
        inert={!isSidebarOpen}
      >
        {/* Sticky Header */}
        <div
          data-tag="sidebar__header"
          className={clsx(
            'h-height-header sticky top-0',
            'flex items-center justify-between',
            'z-30',
            'light:bg-slate-200 bg-gray-800 p-3',
            'light:after:bg-slate-500/60 after:absolute after:bottom-0 after:left-[-10px] after:z-30 after:h-0.5 after:w-(--spacing-sidebar-width) after:bg-gray-700',
          )}
        >
          <div
            data-tag="sidebar__add-series"
            className="flex items-center gap-0.5"
          >
            <div className="relative h-[1lh] w-10">
              <Transition
                show={!isSearchMode}
                enter="transition-all duration-500"
                enterFrom="opacity-0 translate-x-4 scale-95"
                enterTo="opacity-100 translate-x-0 scale-100"
                leave="transition-all duration-300"
                leaveFrom="opacity-100 translate-x-0 scale-100"
                leaveTo="opacity-0 -translate-x-4 scale-95"
              >
                <div
                  className={clsx(
                    'cursor-default font-semibold tracking-wide uppercase',
                    'absolute top-0 left-0',
                    'transform-gpu',
                    'bg-clip-text text-transparent',
                    'bg-gradient-to-r from-purple-400 to-pink-400',
                    '[transition-timing-function:cubic-bezier(0.68,-0.6,0.32,1.6)]',
                    'light:bg-gradient-to-r from-purple-500 to-pink-700',
                  )}
                >
                  &lsaquo;My&rsaquo;
                </div>
              </Transition>

              <Transition
                show={isSearchMode}
                enter="transition-all duration-500"
                enterFrom="opacity-0 translate-x-4 scale-95"
                enterTo="opacity-100 translate-x-0 scale-100"
                leave="transition-all duration-300"
                leaveFrom="opacity-100 translate-x-0 scale-100"
                leaveTo="opacity-0 -translate-x-4 scale-95"
              >
                <div
                  className={clsx(
                    'cursor-default font-semibold uppercase',
                    'absolute top-0 left-0',
                    'transform-gpu',
                    'bg-clip-text text-transparent',
                    'bg-gradient-to-r from-blue-400 to-blue-500',
                    '[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]',
                    'light:bg-gradient-to-r from-blue-500 to-blue-700',
                  )}
                >
                  Find
                </div>
              </Transition>
            </div>

            <h5
              id="drawer-navigation-label"
              data-tag="sidebar__header-title"
              className="light:text-slate-600 cursor-default font-semibold text-gray-400 uppercase"
            >
              Series
            </h5>

            {/* Switch between filer/search modes */}
            <div
              data-tag="series-header__add/filter"
              className="ml-1"
            >
              <SidebarModeSwitch
                isSearchMode={isSearchMode}
                disabled={!activeSeriesId}
                onChange={handleSearchModeChange}
              />
            </div>
          </div>

          <Button
            type="button"
            data-drawer-hide="drawer-navigation"
            data-tag="sidebar__button-close"
            aria-controls="drawer-navigation"
            className={clsx(
              'inline-flex items-center',
              'rounded-lg p-1.5',
              'text-sm text-gray-400',
              'bg-transparent',
              'cursor-pointer',
              'transition-colors duration-150 ease-out',
              'data-[hover]:bg-gray-700 data-[hover]:text-white',
              'light:text-slate-700 light:data-[hover]:bg-blue-600 light:data-[hover]:text-slate-100',
            )}
            onClick={closeSidebar}
          >
            <XMarkIcon
              data-tag="sidebar__button-close-icon"
              aria-hidden="true"
              className="size-6 fill-[currentColor]"
            />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        {/* Sticky Search/Input */}
        <div
          data-tag="sidebar__actions"
          className={clsx(
            'sticky top-(--spacing-height-header)',
            'z-30',
            'h-16 w-full',
            'bg-gray-800 px-2 pt-6',
            'shadow-xl shadow-gray-800',
            'light:bg-slate-200 light:shadow-slate-200',
          )}
        >
          {/* Search/Filter */}
          {isSearchMode ? (
            <Search />
          ) : (
            <div
              data-tag="sidebar__filter"
              className="flex items-center justify-between gap-2"
            >
              <div className="grow-1">
                <Filter />
              </div>
              <SidebarFavoritesToggle
                showOnlyFavorites={isFilterByFavorite}
                onToggle={toggleFilterByFavorite}
              />
            </div>
          )}
        </div>

        {/* Search Series/Track Series List */}
        {fetchSeriesError ? (
          <div
            className="flex flex-col items-center"
            data-tag="sidebar__fetch-error"
          >
            <InfoSearchBlock>
              <ErrorTVIcon />
              <h3 className="mt-2 text-base font-semibold text-red-400">Something went wrong</h3>
            </InfoSearchBlock>
            <SeenItButton onClick={handleTryAgain}>Try again</SeenItButton>
          </div>
        ) : (
          <div
            data-tag="sidebar__series"
            className="mt-4 px-2 pb-3"
          >
            {isSearchMode ? (
              <SearchResults itemClick={handleSearchItemClick} />
            ) : (
              <SeriesList showOnlyFavorites={isFilterByFavorite} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Sidebar.displayName = 'SidebarComponent';
