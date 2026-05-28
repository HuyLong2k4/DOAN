import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ExternalLink, RefreshCcw, Search, ShieldCheck, XCircle } from 'lucide-react';
import { listVolunteers, updateVerificationStatus } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Avatar } from '../components/Avatar';
import { VerificationPill } from '../components/StatusPill';
import { formatDate, formatDateTime } from '../utils/format';
import type { VerificationRecord, VolunteerRecord, VerificationStatus } from '../types';

type Filter = VerificationStatus | 'ALL';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

function StarRating({ value }: { value?: number }) {
  const stars = Math.round(value ?? 0);
  return (
    <span style={{ color: '#f59e0b', letterSpacing: 1 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

export function VolunteersPage() {
  const toast = useToast();
  const [volunteers, setVolunteers] = useState<VolunteerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState<VolunteerRecord | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listVolunteers();
      setVolunteers(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return volunteers.filter((v) => {
      if (filter !== 'ALL' && (v.verification_status || 'PENDING') !== filter) return false;
      if (!kw) return true;
      const u = v.user_id;
      return [u?.full_name, u?.email, u?.phone_number].join(' ').toLowerCase().includes(kw);
    });
  }, [volunteers, keyword, filter]);

  const handleVerify = async (volunteer: VolunteerRecord, status: VerificationStatus) => {
    const userId = volunteer.user_id?._id;
    if (!userId) return;
    try {
      setActingId(userId);
      await updateVerificationStatus(userId, status);
      setVolunteers((prev) =>
        prev.map((v) =>
          v.user_id?._id === userId ? { ...v, verification_status: status } : v,
        ),
      );
      if (detail?.user_id?._id === userId) setDetail((d) => d ? { ...d, verification_status: status } : d);
      toast.success(status === 'APPROVED' ? 'Đã duyệt hồ sơ.' : 'Đã từ chối hồ sơ.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = volunteers.filter((v) => (v.verification_status ?? 'PENDING') === 'PENDING').length;

  return (
    <>
      <PageHeader
        title="Duyệt hồ sơ Volunteer"
        subtitle={pendingCount > 0 ? `${pendingCount} hồ sơ đang chờ duyệt` : `${volunteers.length} volunteer trong hệ thống`}
        actions={
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
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
              placeholder="Tìm theo tên, email, SĐT..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="chip-row">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`chip${filter === f.value ? ' active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><Spinner label="Đang tải danh sách..." /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={28} />} title="Không có hồ sơ phù hợp" description="Thử bỏ filter hoặc tìm kiếm khác." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Trạng thái</th>
                  <th>Giấy tờ</th>
                  <th>Lịch rảnh</th>
                  <th>Ngày đăng ký</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const u = v.user_id;
                  const userId = u?._id ?? v._id;
                  const isPending = (v.verification_status ?? 'PENDING') === 'PENDING';
                  const acting = actingId === userId;
                  return (
                    <tr key={v._id}>
                      <td>
                        <div className="user-cell">
                          <Avatar name={u?.full_name} src={u?.avatar_url} size={36} />
                          <div>
                            <div className="user-name">{u?.full_name || '(Chưa đặt tên)'}</div>
                            <div className="user-id">{u?.email || u?.phone_number || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td><VerificationPill status={v.verification_status ?? 'PENDING'} /></td>
                      <td>
                        {v.verification_document_url ? (
                          <a
                            href={v.verification_document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: '2px 8px' }}
                          >
                            <ExternalLink size={13} /> Xem
                          </a>
                        ) : (
                          <span className="muted">Chưa có</span>
                        )}
                      </td>
                      <td>
                        <span className="muted" style={{ fontSize: 12 }}>
                          {v.availability_time ?? '—'}
                        </span>
                      </td>
                      <td>{formatDateTime(u?.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: '2px 8px' }}
                            onClick={() => setDetail(v)}
                          >
                            Chi tiết
                          </button>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="icon-btn"
                                title="Duyệt"
                                disabled={acting}
                                onClick={() => void handleVerify(v, 'APPROVED')}
                              >
                                <CheckCircle size={16} color="#10b981" />
                              </button>
                              <button
                                type="button"
                                className="icon-btn icon-danger"
                                title="Từ chối"
                                disabled={acting}
                                onClick={() => void handleVerify(v, 'REJECTED')}
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <VolunteerDetailModal
        volunteer={detail}
        acting={actingId === detail?.user_id?._id}
        onClose={() => setDetail(null)}
        onVerify={(status) => detail && void handleVerify(detail, status)}
      />
    </>
  );
}

function VolunteerDetailModal({
  volunteer,
  acting,
  onClose,
  onVerify,
}: {
  volunteer: VolunteerRecord | null;
  acting: boolean;
  onClose: () => void;
  onVerify: (status: VerificationStatus) => void;
}) {
  if (!volunteer) return null;
  const u = volunteer.user_id;
  const isPending = (volunteer.verification_status ?? 'PENDING') === 'PENDING';

  return (
    <Modal
      open
      title="Chi tiết hồ sơ Volunteer"
      description={u?._id ?? volunteer._id}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          {isPending && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={acting}
                onClick={() => onVerify('REJECTED')}
              >
                <XCircle size={15} /> Từ chối
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={acting}
                onClick={() => onVerify('APPROVED')}
              >
                <CheckCircle size={15} /> Duyệt hồ sơ
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="form-grid">
        <div className="user-cell" style={{ marginBottom: 8 }}>
          <Avatar name={u?.full_name} src={u?.avatar_url} size={48} />
          <div>
            <div className="user-name" style={{ fontSize: 16 }}>{u?.full_name || '—'}</div>
            <div className="user-id">{u?.email || u?.phone_number || '—'}</div>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Trạng thái xác minh</span>
          <div style={{ marginTop: 4 }}><VerificationPill status={volunteer.verification_status ?? 'PENDING'} /></div>
        </div>

        {volunteer.verified_at && (
          <div className="field">
            <span className="field-label">Duyệt lúc</span>
            <span>{formatDateTime(volunteer.verified_at)}</span>
          </div>
        )}

        <div className="field">
          <span className="field-label">Loại giấy tờ</span>
          <span>{volunteer.verification_document_type || '—'}</span>
        </div>

        {volunteer.verification_document_url && (
          <div className="field">
            <span className="field-label">Ảnh giấy tờ</span>
            <a href={volunteer.verification_document_url} target="_blank" rel="noreferrer">
              <img
                src={volunteer.verification_document_url}
                alt="Giấy tờ"
                style={{ marginTop: 6, maxWidth: '100%', maxHeight: 240, borderRadius: 6, border: '1px solid #e2e8f0', objectFit: 'contain' }}
              />
            </a>
          </div>
        )}

        <div className="field">
          <span className="field-label">Lịch rảnh</span>
          <span>{volunteer.availability_time ?? '—'} · {Array.isArray(volunteer.availability_days) ? volunteer.availability_days.join(', ') : (volunteer.availability_days ?? '—')}</span>
        </div>

        <div className="field">
          <span className="field-label">Ngày đăng ký</span>
          <span>{formatDateTime(u?.createdAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
