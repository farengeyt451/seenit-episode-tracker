import { FilterIcon } from '@/components/ui';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { FC } from 'react';

interface SidebarModeSwitchProps {
  isSearchMode: boolean;
  disabled?: boolean;
  onChange: (isSearch: boolean) => void;
}

export const SidebarModeSwitch: FC<SidebarModeSwitchProps> = ({ isSearchMode, onChange, disabled = false }) => {
  return (
    <button
      data-tag="sidebar-switch-mode"
      disabled={disabled}
      onClick={() => onChange(!isSearchMode)}
      className={clsx(
        'group relative flex h-8 w-15 items-center',
        'rounded-full bg-gray-700/50 px-1 py-0',
        'transition-all duration-200',
        'focus:ring-2 focus:outline-none',
        'light:bg-slate-100 light:shadow-2xl light:shadow-gray-500/90',
        {
          'pointer-events-none': disabled,
          'light:hover:bg-slate-300/70 cursor-pointer hover:bg-gray-700/70': !disabled,
          'focus:ring-sky-500/50': !disabled && isSearchMode,
          'focus:ring-purple-500/50': !disabled && !isSearchMode,
        },
      )}
    >
      {/* Sliding background */}
      <div
        className={clsx(
          'absolute h-6 w-6 rounded-full',
          'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          {
            'left-1 bg-gray-400/20': disabled,
            'light:bg-purple-600 left-8 bg-purple-500/40': !disabled && !isSearchMode,
            'light:bg-blue-600 left-1 bg-blue-500/40': !disabled && isSearchMode,
          },
        )}
      />

      {/* Icons container */}
      <div className="relative z-10 flex w-full justify-between">
        {/* Search Icon */}
        <div className="m-0 flex h-6 w-6 items-center justify-center p-0">
          <MagnifyingGlassIcon
            className={clsx('size-4 transform-gpu transition-all duration-200', {
              'light:text-slate-400 scale-90 text-gray-500': disabled,
              'light:text-slate-200 scale-100 text-blue-400': !disabled && isSearchMode,
              'light:text-slate-500 scale-90 text-gray-400': !disabled && !isSearchMode,
            })}
          />
        </div>

        {/* Filter Icon */}
        <div className="flex h-6 w-6 items-center justify-center">
          <FilterIcon
            className={clsx('transform-gpu transition-all duration-200', {
              'light:text-slate-400 scale-90 text-gray-500': disabled,
              'light:text-slate-200 scale-100 text-purple-400': !disabled && !isSearchMode,
              'light:text-slate-500 scale-90 text-gray-400': !disabled && isSearchMode,
            })}
          />
        </div>
      </div>
    </button>
  );
};

SidebarModeSwitch.displayName = 'SidebarModeSwitchComponent';
