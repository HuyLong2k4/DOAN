import axios, { AxiosError, type AxiosInstance } from 'axios';

const STORAGE_KEYS = {
  apiBaseUrl: 'admin.apiBaseUrl',
  token: 'admin.accessToken',
  user: 'admin.user',
} as const;

const API_SUFFIX = /\/api\/?$/i;

export function normalizeBaseUrl(value: string): string {
  const trimmed = (value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (API_SUFFIX.test(trimmed)) return trimmed.replace(/\/$/, '');
  return `${trimmed}/api`;
}

export function resolveDefaultApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv) return normalizeBaseUrl(fromEnv);
  const host = (typeof window !== 'undefined' && window.location.hostname) || 'localhost';
  return normalizeBaseUrl(`http://${host}:5000`);
}

// Ảnh upload được lưu kèm host cố định lúc client upload (vd IP LAN của mobile),
// nên admin ở máy/mạng khác không tải được. Ánh xạ lại path /uploads về đúng
// origin backend mà admin đang kết nối — backend này chắc chắn reachable vì
// admin vừa load được dữ liệu từ nó.
export function resolveAssetUrl(url?: string | null): string {
  const trimmed = (url || '').trim();
  if (!trimmed || /^(data|blob):/i.test(trimmed)) return trimmed;

  const apiBase = storage.getApiBaseUrl() || resolveDefaultApiBaseUrl();
  const origin = apiBase.replace(/\/api\/?$/i, '');

  if (trimmed.startsWith('/')) return `${origin}${trimmed}`;

  try {
    const parsed = new URL(trimmed);
    if (/\/uploads\//i.test(parsed.pathname)) {
      return `${origin}${parsed.pathname}${parsed.search}`;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

// apiBaseUrl giữ ở localStorage (config, không nhạy cảm).
// token + user lưu vào sessionStorage → đóng tab là mất phiên, buộc đăng nhập lại.
export const storage = {
  getApiBaseUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || '';
  },
  setApiBaseUrl(value: string): void {
    if (value) localStorage.setItem(STORAGE_KEYS.apiBaseUrl, value);
    else localStorage.removeItem(STORAGE_KEYS.apiBaseUrl);
  },
  getToken(): string {
    return sessionStorage.getItem(STORAGE_KEYS.token) || '';
  },
  setToken(value: string): void {
    if (value) sessionStorage.setItem(STORAGE_KEYS.token, value);
    else sessionStorage.removeItem(STORAGE_KEYS.token);
  },
  getUser<T = unknown>(): T | null {
    const raw = sessionStorage.getItem(STORAGE_KEYS.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUser(value: unknown): void {
    if (value) sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(value));
    else sessionStorage.removeItem(STORAGE_KEYS.user);
  },
  clearSession(): void {
    sessionStorage.removeItem(STORAGE_KEYS.token);
    sessionStorage.removeItem(STORAGE_KEYS.user);
  },
};

export interface ApiClient extends AxiosInstance {}

let activeClient: ApiClient | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export function buildClient(baseURL: string, token?: string): ApiClient {
  const client = axios.create({
    baseURL,
    timeout: 20000,
  }) as ApiClient;

  client.interceptors.request.use((config) => {
    const auth = token || storage.getToken();
    if (auth) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${auth}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; success?: boolean }>) => {
      if (error.response?.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export function setActiveClient(client: ApiClient | null): void {
  activeClient = client;
}

export function getActiveClient(): ApiClient {
  if (!activeClient) throw new Error('API client chưa khởi tạo. Vui lòng đăng nhập lại.');
  return activeClient;
}

export function getErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi không xác định.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
