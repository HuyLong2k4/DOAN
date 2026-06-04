import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { http } from '../api/http';

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
    // Đồng bộ ngôn ngữ lên backend để thông báo render đúng ngôn ngữ.
    // Fire-and-forget; bỏ qua nếu chưa đăng nhập (401).
    http.post('/users/me/push-token', { language }).catch(() => {});
  },
}));
