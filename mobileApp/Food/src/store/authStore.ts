import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../types';

// Khoá cũ (đã ngừng sử dụng) — vẫn dọn dẹp ở hydrate để migration sạch.
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';
const LEGACY_AUTH_USER_KEY = 'authUser';

type AuthState = {
  token: string | null;
  user: User | null;
  isReady: boolean;
  setToken: (token: string | null) => Promise<void>;
  setUser:  (user: User | null) => void;
  hydrate:  () => Promise<void>;
  clear:    () => Promise<void>;
};

// Token & user chỉ giữ trong memory → đóng app = mất phiên = phải đăng nhập lại.
export const useAuthStore = create<AuthState>((set) => ({
  token:   null,
  user:    null,
  isReady: false,

  setToken: async (token) => {
    set({ token });
  },

  setUser: (user) => {
    set({ user });
  },

  hydrate: async () => {
    // Dọn dữ liệu phiên cũ (nếu có) để không vô tình auto-login.
    await Promise.all([
      SecureStore.deleteItemAsync(LEGACY_ACCESS_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(LEGACY_AUTH_USER_KEY).catch(() => {}),
    ]);
    set({ token: null, user: null, isReady: true });
  },

  clear: async () => {
    set({ token: null, user: null });
  },
}));
