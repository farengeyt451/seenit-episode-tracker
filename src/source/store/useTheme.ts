import { THEME_STORAGE_NAME } from '@/constants';
import { Theme } from '@/enums';
import { chromeStorage } from '@/utils';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

type ThemeStore = {
  theme: Theme;
};

type ThemeActions = {
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeStore = {
  theme: Theme.Light,
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
        storage: createJSONStorage(() => chromeStorage),
        version: 1.0,
      },
    ),
    { name: 'Store', store: 'theme' },
  ),
);
