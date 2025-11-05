import { Button } from '@headlessui/react';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { FC, JSX } from 'react';

interface SidebarFavoritesToggleProps {
  showOnlyFavorites: boolean;
  onToggle: () => void;
}

export const SidebarFavoritesToggle: FC<SidebarFavoritesToggleProps> = ({
  showOnlyFavorites,
  onToggle,
}): JSX.Element => (
  <Button
    type="button"
    data-tag="sidebar-favorites"
    aria-label="Toggle favorites filter"
    onClick={onToggle}
    className={clsx(
      'group relative shrink-0 rounded-lg p-1.5',
      'light:text-slate-800 cursor-pointer text-gray-400',
      'transition-all duration-300 ease-linear',
      'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 focus-visible:outline-none',
      'light:bg-slate-100 light:hover:bg-slate-300 bg-gray-700/70 hover:bg-gray-700',
      showOnlyFavorites &&
        'light:from-amber-100/90 light:via-yellow-100/90 light:to-orange-100/90 light:text-amber-900 light:ring-amber-200 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-400/20 text-yellow-300 ring-1 ring-amber-400/40',
    )}
  >
    <span className="relative block h-5 w-5">
      <StarOutlineIcon
        className={clsx(
          'absolute inset-0 size-5 transform transition-all duration-300 ease-out',
          showOnlyFavorites ? 'scale-50 rotate-45 opacity-0' : 'scale-100 rotate-0 opacity-100',
        )}
        aria-hidden="true"
      />
      <StarSolidIcon
        className={clsx(
          'light:text-amber-700 absolute inset-0 size-5 text-yellow-400 drop-shadow-[0_0_4px] drop-shadow-amber-400',
          'transform transition-all duration-300 ease-out',
          showOnlyFavorites ? 'scale-105 rotate-0 opacity-100' : 'scale-50 -rotate-45 opacity-0',
        )}
        aria-hidden="true"
      />
    </span>
    <span className="sr-only">{showOnlyFavorites ? 'Show all series' : 'Show only favorite series'}</span>
  </Button>
);

SidebarFavoritesToggle.displayName = 'SidebarFavoritesToggleComponent';
