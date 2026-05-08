import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildClient,
  resolveDefaultApiBaseUrl,
  setActiveClient,
  setUnauthorizedHandler,
  storage,
} from '../api/client';
import { logoutSession } from '../api/endpoints';
import type { AuthUser } from '../types';

interface AuthState {
  apiBaseUrl: string;
  token: string;
  user: AuthUser | null;
  initializing: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: AuthUser, apiBaseUrl: string) => void;
  logout: () => void;
  setApiBaseUrl: (url: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => ({
    apiBaseUrl: storage.getApiBaseUrl() || resolveDefaultApiBaseUrl(),
    token: storage.getToken(),
    user: storage.getUser<AuthUser>(),
    initializing: true,
  }));

  useEffect(() => {
    if (state.token && state.apiBaseUrl) {
      const client = buildClient(state.apiBaseUrl, state.token);
      setActiveClient(client);
    } else {
      setActiveClient(null);
    }
    setState((prev) => ({ ...prev, initializing: false }));
    // chỉ chạy một lần lúc khởi tạo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearLocalSession = useCallback(() => {
    storage.clearSession();
    setActiveClient(null);
    setState((prev) => ({ ...prev, token: '', user: null }));
  }, []);

  const logout = useCallback(() => {
    // Báo server vô hiệu hoá JWT (token_version++) trước khi xoá local.
    // Nếu fail (mạng / token đã hết hạn) vẫn clear local để user thoát được.
    void logoutSession().catch(() => {});
    clearLocalSession();
  }, [clearLocalSession]);

  useEffect(() => {
    // Khi server trả 401, chỉ clear local — không gọi /auth/logout (token đã invalid).
    setUnauthorizedHandler(() => {
      clearLocalSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession]);

  const login = useCallback((token: string, user: AuthUser, apiBaseUrl: string) => {
    storage.setApiBaseUrl(apiBaseUrl);
    storage.setToken(token);
    storage.setUser(user);
    const client = buildClient(apiBaseUrl, token);
    setActiveClient(client);
    setState({ apiBaseUrl, token, user, initializing: false });
  }, []);

  const setApiBaseUrl = useCallback((url: string) => {
    storage.setApiBaseUrl(url);
    setState((prev) => ({ ...prev, apiBaseUrl: url }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.token && state.user),
      login,
      logout,
      setApiBaseUrl,
    }),
    [state, login, logout, setApiBaseUrl],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>.');
  return ctx;
}
