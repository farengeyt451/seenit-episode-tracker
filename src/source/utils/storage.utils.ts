import { Nullable } from '@/utility-types';
import { StateStorage } from 'zustand/middleware';

export const chromeStorage: StateStorage = {
  getItem: async (key: string): Promise<Nullable<string>> => {
    if (chrome?.storage) {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } else {
      return localStorage.getItem(key);
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (chrome?.storage) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (chrome?.storage) {
      await chrome.storage.local.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  },
};
