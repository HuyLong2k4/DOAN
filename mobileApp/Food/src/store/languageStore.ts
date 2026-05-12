import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const LANGUAGE_KEY = 'appLanguage';

export type AppLanguage = 'en' | 'vi';

type LanguageState = {
  language: AppLanguage;
  isReady: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'vi',
  isReady: false,

  hydrate: async () => {
    const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'vi') {
      set({ language: saved, isReady: true });
      return;
    }
    set({ isReady: true });
  },

  setLanguage: async (language) => {
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    set({ language });
  },
}));
