import { THEME_STORAGE_NAME } from '@/constants';
import { Theme } from '@/enums';
import { encodedStorage } from '@/utils/storage.utils';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

type ThemeStore = {
  theme: Theme;
};

type ThemeActions = {
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeStore = {
  theme: Theme.Dark,
} as const;

export const useThemeStore = create<ThemeStore & ThemeActions>()(
  devtools(
    persist(
      set => ({
        ...initialState,
        setTheme: (theme: Theme) =>
          set(
            {
              theme,
            },
            false,
            'setTheme',
          ),
      }),
      {
        name: THEME_STORAGE_NAME,
        storage: createJSONStorage(() => encodedStorage),
        version: 1.0,
      },
    ),
    { name: 'Store', store: 'theme' },
  ),
);
