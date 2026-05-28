import { NavLink } from 'react-router-dom';
import {
  Gauge,
  HandHeart,
  HeartHandshake,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { roleLabel } from '../utils/format';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Tổng quan', icon: Gauge },
  { to: '/users', label: 'Người dùng', icon: Users },
  { to: '/donations', label: 'Donations', icon: HandHeart },
  { to: '/requests', label: 'Requests', icon: HeartHandshake },
  { to: '/volunteers', label: 'Volunteer', icon: ShieldCheck },
  { to: '/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/profile', label: 'Tài khoản', icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const displayName = user?.full_name || user?.email || user?.phone_number || 'Admin';

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">FR</div>
        <div>
          <p className="brand-name">Food Rescue</p>
          <p className="brand-sub">Admin Console</p>
        </div>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="me-card">
          <Avatar name={displayName} src={user?.avatar_url} size={40} />
          <div className="me-info">
            <span className="me-name">{displayName}</span>
            <span className="me-role">{roleLabel(user?.role)}</span>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-block" onClick={logout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
