import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil, RefreshCcw, Search, Trash2, UserPlus2 } from 'lucide-react';
import { deleteUser, listUsers, updateUser } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Avatar } from '../components/Avatar';
import { RolePill } from '../components/StatusPill';
import { formatDateTime, formatNumber, USER_ROLES } from '../utils/format';
import type { AdminUser, UserRole } from '../types';

const ROLE_FILTERS: { label: string; value: UserRole | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Donor', value: 'DONOR' },
  { label: 'Receiver', value: 'RECEIVER' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
  { label: 'Chưa thiết lập', value: 'UNSET' },
];

export function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'ALL' && (user.role || 'UNSET') !== roleFilter) return false;
      if (!kw) return true;
      const haystack = [
        user.full_name || '',
        user.email || '',
        user.phone_number || '',
        user.role || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(kw);
    });
  }, [users, keyword, roleFilter]);

  const onDelete = async (user: AdminUser) => {
    const display = user.full_name || user.email || user.phone_number || user._id;
    const confirmed = window.confirm(`Xoá user "${display}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;
    try {
      await deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      toast.success('Đã xoá user.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title="Quản lý người dùng"
        subtitle={`${formatNumber(users.length)} tài khoản trong hệ thống`}
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => void loadUsers()}>
            <RefreshCcw size={16} /> Làm mới
          </button>
        }
      />

      <section className="card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="search"
              placeholder="Tìm theo tên, email, số điện thoại..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="chip-row">
            {ROLE_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip${roleFilter === option.value ? ' active' : ''}`}
                onClick={() => setRoleFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <Spinner label="Đang tải danh sách user..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UserPlus2 size={28} />}
            title="Không có user phù hợp"
            description="Thử bỏ filter hoặc tìm kiếm khác."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Liên hệ</th>
                  <th>Điểm</th>
                  <th>Tạo lúc</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        <Avatar name={user.full_name} src={user.avatar_url} size={36} />
                        <div>
                          <div className="user-name">{user.full_name || '(Chưa đặt tên)'}</div>
                          <div className="user-id">{user._id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RolePill role={user.role} />
                    </td>
                    <td>
                      {user.email ? <div>{user.email}</div> : null}
                      {user.phone_number ? <div className="muted">{user.phone_number}</div> : null}
                      {!user.email && !user.phone_number ? <span className="muted">—</span> : null}
                    </td>
                    <td>{formatNumber(user.points)}</td>
                    <td>{formatDateTime(user.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setEditing(user)}
                          title="Sửa thông tin"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-danger"
                          onClick={() => void onDelete(user)}
                          title="Xoá"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <UserEditModal
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
          setEditing(null);
        }}
      />
    </>
  );
}

interface UserEditModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}

function UserEditModal({ user, onClose, onSaved }: UserEditModalProps) {
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('UNSET');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setEmail(user.email || '');
    setPhone(user.phone_number || '');
    setRole((user.role || 'UNSET') as UserRole);
  }, [user]);

  if (!user) return null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateUser(user._id, {
        full_name: fullName.trim() || undefined,
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
        role,
      });
      toast.success('Đã cập nhật user.');
      onSaved({ ...user, ...(updated || {}), full_name: fullName, email, phone_number: phone, role });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(user)}
      title="Cập nhật thông tin user"
      description={user._id}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="submit"
            form="user-edit-form"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </>
      }
    >
      <form id="user-edit-form" className="form-grid" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Họ tên</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Số điện thoại</span>
          <input
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Vai trò</span>
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            {USER_ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  );
}
