import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { HandHeart, HeartHandshake, RefreshCcw, Trophy, Users } from 'lucide-react';
import { listDonations, listRequests, listUsers } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { donationStatusLabel, formatNumber, requestStatusLabel } from '../utils/format';
import type { AdminUser, DonationRecord, RequestRecord, UserRole } from '../types';

const ROLE_PALETTE: Record<UserRole, string> = {
  ADMIN: '#8b5cf6',
  DONOR: '#10b981',
  RECEIVER: '#0d9488',
  VOLUNTEER: '#f59e0b',
  UNSET: '#94a3b8',
};

const DONATION_PALETTE = ['#f59e0b', '#0d9488', '#06b6d4', '#10b981', '#94a3b8', '#ef4444'];

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: 'primary' | 'amber' | 'cyan' | 'emerald';
}

function KpiCard({ label, value, hint, icon, tone }: KpiCardProps) {
  return (
    <article className={`kpi kpi-${tone}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-meta">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value}</span>
        {hint ? <span className="kpi-hint">{hint}</span> : null}
      </div>
    </article>
  );
}

export function DashboardPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [usersData, donationsData, requestsData] = await Promise.all([
        listUsers(),
        listDonations(),
        listRequests(),
      ]);
      setUsers(usersData);
      setDonations(donationsData);
      setRequests(requestsData);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalPoints = useMemo(
    () => users.reduce((sum, user) => sum + (user.points || 0), 0),
    [users],
  );

  const completedDonations = useMemo(
    () => donations.filter((d) => d.status === 'COMPLETED').length,
    [donations],
  );

  const roleData = useMemo(() => {
    const seed: Record<UserRole, number> = {
      ADMIN: 0,
      DONOR: 0,
      RECEIVER: 0,
      VOLUNTEER: 0,
      UNSET: 0,
    };
    for (const user of users) {
      const role = (user.role || 'UNSET') as UserRole;
      seed[role] += 1;
    }
    return Object.entries(seed).map(([role, count]) => ({
      role: role as UserRole,
      count,
    }));
  }, [users]);

  const donationStatusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const donation of donations) {
      const key = donation.status || 'UNKNOWN';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([status, count]) => ({
      status,
      label: donationStatusLabel(status as DonationRecord['status']),
      count,
    }));
  }, [donations]);

  const requestStatusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const request of requests) {
      const key = request.status || 'UNKNOWN';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([status, count]) => ({
      status,
      label: requestStatusLabel(status as RequestRecord['status']),
      count,
    }));
  }, [requests]);

  if (loading) {
    return (
      <div className="page-loading">
        <Spinner label="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Tổng quan hệ thống"
        subtitle="Số liệu nhanh về người dùng, đơn quyên góp và yêu cầu nhận thực phẩm."
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void loadData(true)}
            disabled={refreshing}
          >
            <RefreshCcw size={16} /> Làm mới
          </button>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          label="Người dùng"
          value={formatNumber(users.length)}
          hint={`${formatNumber(roleData.find((r) => r.role === 'DONOR')?.count || 0)} donor · ${formatNumber(roleData.find((r) => r.role === 'RECEIVER')?.count || 0)} receiver`}
          icon={<Users size={22} />}
          tone="primary"
        />
        <KpiCard
          label="Tổng donation"
          value={formatNumber(donations.length)}
          hint={`${formatNumber(completedDonations)} đã hoàn tất`}
          icon={<HandHeart size={22} />}
          tone="emerald"
        />
        <KpiCard
          label="Yêu cầu nhận"
          value={formatNumber(requests.length)}
          hint={`${formatNumber(requests.filter((r) => r.status === 'PENDING').length)} đang chờ xử lý`}
          icon={<HeartHandshake size={22} />}
          tone="cyan"
        />
        <KpiCard
          label="Tổng điểm tích luỹ"
          value={formatNumber(totalPoints)}
          hint="Donor và Volunteer cộng dồn"
          icon={<Trophy size={22} />}
          tone="amber"
        />
      </section>

      <section className="grid-2">
        <article className="card">
          <header className="card-head">
            <h3>Phân bố vai trò</h3>
            <span className="card-sub">Tổng {formatNumber(users.length)} tài khoản</span>
          </header>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="count"
                  nameKey="role"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {roleData.map((entry) => (
                    <Cell key={entry.role} fill={ROLE_PALETTE[entry.role]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card">
          <header className="card-head">
            <h3>Trạng thái Donations</h3>
            <span className="card-sub">{formatNumber(donations.length)} đơn</span>
          </header>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={donationStatusData} margin={{ top: 16, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {donationStatusData.map((_, index) => (
                    <Cell key={index} fill={DONATION_PALETTE[index % DONATION_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="card">
        <header className="card-head">
          <h3>Trạng thái Requests</h3>
          <span className="card-sub">{formatNumber(requests.length)} yêu cầu</span>
        </header>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={requestStatusData} layout="vertical" margin={{ top: 16, right: 24, bottom: 0, left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#008080" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}
