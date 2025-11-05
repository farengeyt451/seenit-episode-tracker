import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type SidebarStore = {
  isSidebarOpen: boolean;
  isFilterByFavorite: boolean;
};

type SidebarActions = {
  setSidebarOpenState: (isSidebarOpen: boolean) => void;
  toggleFilterByFavorite: () => void;
};

const initialState: SidebarStore = {
  isSidebarOpen: false,
  isFilterByFavorite: false,
} as const;

export const useSidebarStore = create<SidebarStore & SidebarActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      setSidebarOpenState: (isSidebarOpen: boolean) => set({ isSidebarOpen }, false, 'setSidebarOpenState'),
      toggleFilterByFavorite: () => {
        const favoriteFlag = get().isFilterByFavorite;
        return set({ isFilterByFavorite: !favoriteFlag }, false, 'toggleFilterByFavorite');
      },
    }),
    { name: 'Store', store: 'sidebar' },
  ),
);
