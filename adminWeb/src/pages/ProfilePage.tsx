import { type FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { changeOwnPassword } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Avatar } from '../components/Avatar';
import { RolePill } from '../components/StatusPill';

export function ProfilePage() {
  const { user, apiBaseUrl } = useAuth();
  const toast = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userId = user?.id || user?._id || '';

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) {
      toast.error('Không xác định được ID admin.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới cần ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      await changeOwnPassword(userId, oldPassword, newPassword);
      toast.success('Đã đổi mật khẩu.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user?.full_name || user?.email || user?.phone_number || 'Admin';

  return (
    <>
      <PageHeader
        title="Tài khoản admin"
        subtitle="Thông tin phiên làm việc và đổi mật khẩu."
      />

      <section className="card profile-card">
        <div className="profile-head">
          <Avatar name={displayName} src={user?.avatar_url} size={64} />
          <div>
            <h2>{displayName}</h2>
            <RolePill role={user?.role} />
          </div>
        </div>

        <div className="profile-meta">
          <MetaItem label="Email" value={user?.email || '—'} />
          <MetaItem label="Số điện thoại" value={user?.phone_number || '—'} />
          <MetaItem label="ID" value={userId || '—'} />
          <MetaItem label="API URL" value={apiBaseUrl} />
        </div>
      </section>

      <section className="card">
        <header className="card-head">
          <h3>Đổi mật khẩu</h3>
          <span className="card-sub">Khuyến nghị thay đổi định kỳ 90 ngày.</span>
        </header>

        <form className="form-grid form-grid-narrow" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Mật khẩu hiện tại</span>
            <span className="field-input">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                required
              />
            </span>
          </label>

          <label className="field">
            <span className="field-label">Mật khẩu mới</span>
            <span className="field-input">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={6}
                required
              />
            </span>
          </label>

          <label className="field">
            <span className="field-label">Xác nhận mật khẩu mới</span>
            <span className="field-input">
              <LockKeyhole size={16} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
              />
            </span>
          </label>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

interface MetaItemProps {
  label: string;
  value: string;
}

function MetaItem({ label, value }: MetaItemProps) {
  return (
    <div className="meta-item">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}
