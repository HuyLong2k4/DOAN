import { type FormEvent, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { login } from '../api/endpoints';
import { getErrorMessage, normalizeBaseUrl, resolveDefaultApiBaseUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login: setSession, apiBaseUrl: storedBaseUrl } = useAuth();
  const toast = useToast();

  const [apiBaseUrl, setApiBaseUrl] = useState<string>(storedBaseUrl || resolveDefaultApiBaseUrl());
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setApiBaseUrl(storedBaseUrl || resolveDefaultApiBaseUrl());
  }, [storedBaseUrl]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeBaseUrl(apiBaseUrl);
    if (!normalized) {
      toast.error('API URL không hợp lệ.');
      return;
    }

    setSubmitting(true);
    try {
      const { accessToken, user } = await login(normalized, { identifier, password });
      setSession(accessToken, user, normalized);
      toast.success(`Xin chào ${user.full_name || 'Admin'}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-head">
          <img src="/avatarApp.png" alt="Food 4 life" className="login-logo" />
          <h1>Food 4 life</h1>
          <p className="login-sub">Bảng điều khiển quản trị</p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Email hoặc số điện thoại</span>
            <span className="field-input">
              <UserRound size={16} />
              <input
                type="text"
                placeholder="admin@example.com"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label className="field">
            <span className="field-label">Mật khẩu</span>
            <span className="field-input">
              <LockKeyhole size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="field-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="login-foot">© {new Date().getFullYear()} Food 4 life · Admin</p>
      </div>
    </div>
  );
}
