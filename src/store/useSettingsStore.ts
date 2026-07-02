import { SETTINGS_STORAGE_NAME } from '@/constants';
import { encodedStorage } from '@/utils';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

const SETTINGS_STORE_VERSION = 1;

type SettingsStore = {
  isFooterVisible: boolean;
};

type SettingsActions = {
  setFooterVisible: (isFooterVisible: boolean) => void;
  toggleFooter: () => void;
};

const initialState: SettingsStore = {
  isFooterVisible: true,
} as const;

export const useSettingsStore = create<SettingsStore & SettingsActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setFooterVisible: (isFooterVisible: boolean) => set({ isFooterVisible }, false, 'setFooterVisible'),
        toggleFooter: () => set({ isFooterVisible: !get().isFooterVisible }, false, 'toggleFooter'),
      }),
      {
        name: SETTINGS_STORAGE_NAME,
        storage: createJSONStorage(() => encodedStorage),
        version: SETTINGS_STORE_VERSION,
      },
    ),
    { name: 'Store', store: 'settings' },
  ),
);
