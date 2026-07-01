import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const http = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lấy token từ Zustand store thay vì SecureStore mỗi request (đã được hydrate sẵn).
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (__DEV__) {
    console.log(
      `[http] ${(config.method || 'GET').toUpperCase()} ${config.baseURL}${config.url} — token=${token ? token.slice(0, 12) + '...' : 'NULL'}`,
    );
  }
  return config;
});

// Tự động clear session khi token bị server invalidate (token_version mismatch / hết hạn).
// CHỈ clear khi request thực sự đã gửi Authorization header — nếu request không có
// Bearer (vd: gọi API trong khi state.token tạm thời null) thì 401 là expected,
// không nên xoá session đang dùng cho các request khác.
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      const requestHadAuth = Boolean(error?.config?.headers?.Authorization);
      const { token, clear } = useAuthStore.getState();
      if (requestHadAuth && token) {
        await clear();
      }
    }
    return Promise.reject(error);
  },
);
