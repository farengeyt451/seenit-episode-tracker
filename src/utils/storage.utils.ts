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

export const encodedStorage: StateStorage = {
  getItem: async (name: string) => {
    const encrypted = await chromeStorage.getItem(name);
    if (!encrypted) return null;

    try {
      const decrypted = atob(encrypted);
      return decrypted;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    const encrypted = btoa(value).toString();
    await chromeStorage.setItem(name, encrypted);
  },
  removeItem: async (name: string) => {
    await chromeStorage.removeItem(name);
  },
};
