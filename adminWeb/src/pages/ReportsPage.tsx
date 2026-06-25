import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, ShieldAlert } from 'lucide-react';
import { listReports, resolveReport } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Avatar } from '../components/Avatar';
import { RolePill } from '../components/StatusPill';
import { formatDateTime } from '../utils/format';
import type { ReportAction, ReportRecord, ReportStatus } from '../types';

const REASON_LABEL: Record<string, string> = {
  SPOILED: 'Thực phẩm hỏng / ôi thiu',
  EXPIRED_UNSAFE: 'Quá hạn / không an toàn',
  WRONG_INFO: 'Thông tin sai lệch',
  FRAUD: 'Có dấu hiệu gian lận',
  INAPPROPRIATE: 'Nội dung không phù hợp',
  OTHER: 'Khác',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  RESOLVED: 'Đã xử lý',
  DISMISSED: 'Bỏ qua',
};

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#FEF3C7', fg: '#92400E' },
  RESOLVED: { bg: '#DCFCE7', fg: '#166534' },
  DISMISSED: { bg: '#F1F5F9', fg: '#475569' },
};

const ACTION_LABEL: Record<string, string> = {
  NONE: 'Không áp dụng',
  WARN: 'Cảnh báo người đăng',
  LOCK_USER: 'Khoá tài khoản',
  REMOVE_DONATION: 'Gỡ đơn vi phạm',
};

type StatusFilter = 'ALL' | ReportStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xử lý', value: 'PENDING' },
  { label: 'Đã xử lý', value: 'RESOLVED' },
  { label: 'Bỏ qua', value: 'DISMISSED' },
];

function StatusBadge({ status }: { status?: string }) {
  const color = STATUS_COLOR[status ?? ''] || { bg: '#F1F5F9', fg: '#475569' };
  return (
    <span
      style={{
        backgroundColor: color.bg,
        color: color.fg,
        fontSize: 12,
        fontWeight: 600,
        padding: '2px 10px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABEL[status ?? ''] || status}
    </span>
  );
}

export function ReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [detail, setDetail] = useState<ReportRecord | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listReports();
      setReports(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const pendingCount = useMemo(
    () => reports.filter((r) => r.status === 'PENDING').length,
    [reports],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!kw) return true;
      const reporter = r.reporter_id?.full_name ?? '';
      const reported = r.reported_user_id?.full_name ?? '';
      const donation = r.donation_id?.title ?? '';
      const desc = r.description ?? '';
      return [reporter, reported, donation, desc].join(' ').toLowerCase().includes(kw);
    });
  }, [reports, keyword, statusFilter]);

  const { page, setPage, pageSize, total, totalPages, pageItems } = usePagination(filtered, {
    pageSize: 10,
    resetKey: `${keyword}|${statusFilter}`,
  });

  return (
    <>
      <PageHeader
        title="Báo cáo vi phạm"
        subtitle={
          pendingCount > 0
            ? `${reports.length} báo cáo · ${pendingCount} chờ xử lý`
            : `${reports.length} báo cáo`
        }
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
              placeholder="Tìm theo người báo cáo, đối tượng, nội dung..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="chip-row">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`chip${statusFilter === f.value ? ' active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><Spinner label="Đang tải báo cáo..." /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ShieldAlert size={28} />} title="Không có báo cáo phù hợp" description="Thử bỏ filter hoặc tìm kiếm khác." />
        ) : (
          <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người báo cáo</th>
                  <th>Đối tượng bị báo cáo</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => {
                  const reporter = r.reporter_id;
                  const reported = r.reported_user_id;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="user-cell">
                          <Avatar name={reporter?.full_name} src={reporter?.avatar_url} size={32} />
                          <div>
                            <div className="user-name">{reporter?.full_name || '(Ẩn danh)'}</div>
                            {reporter?.role && (
                              <div style={{ marginTop: 2 }}><RolePill role={reporter.role} /></div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {reported ? (
                          <div className="user-cell">
                            <Avatar name={reported?.full_name} src={reported?.avatar_url} size={32} />
                            <div>
                              <div className="user-name">{reported?.full_name || '(Ẩn danh)'}</div>
                              {r.donation_id?.title && (
                                <div className="muted" style={{ fontSize: 12 }}>Đơn: {r.donation_id.title}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="muted" style={{ fontSize: 13 }}>{r.donation_id?.title || '—'}</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>{REASON_LABEL[r.reason ?? ''] || r.reason}</span>
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{formatDateTime(r.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '2px 8px' }}
                          onClick={() => setDetail(r)}
                        >
                          {r.status === 'PENDING' ? 'Xử lý' : 'Chi tiết'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onChange={setPage}
          />
          </>
        )}
      </section>

      <ReportDetailModal
        report={detail}
        onClose={() => setDetail(null)}
        onResolved={() => { setDetail(null); void load(); }}
      />
    </>
  );
}

function ReportDetailModal({
  report,
  onClose,
  onResolved,
}: {
  report: ReportRecord | null;
  onClose: () => void;
  onResolved: () => void;
}) {
  const toast = useToast();
  const [decision, setDecision] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [action, setAction] = useState<ReportAction>('NONE');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (report) {
      setDecision('RESOLVED');
      setAction('NONE');
      setNote(report.admin_note ?? '');
    }
  }, [report]);

  if (!report) return null;
  const reporter = report.reporter_id;
  const reported = report.reported_user_id;
  const isPending = report.status === 'PENDING';

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await resolveReport(report._id, decision, note.trim() || undefined, decision === 'RESOLVED' ? action : 'NONE');
      toast.success('Đã cập nhật trạng thái báo cáo.');
      onResolved();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      title="Chi tiết báo cáo"
      description={report._id}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          {isPending && (
            <button type="button" className="btn btn-primary" onClick={() => void onSubmit()} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu xử lý'}
            </button>
          )}
        </div>
      }
    >
      <div className="form-grid">
        <div className="field">
          <span className="field-label">Người báo cáo</span>
          <div className="user-cell" style={{ marginTop: 4 }}>
            <Avatar name={reporter?.full_name} src={reporter?.avatar_url} size={36} />
            <div>
              <div className="user-name">{reporter?.full_name || '(Ẩn danh)'}</div>
              {reporter?.role && <div style={{ marginTop: 2 }}><RolePill role={reporter.role} /></div>}
            </div>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Đối tượng bị báo cáo</span>
          {reported ? (
            <div className="user-cell" style={{ marginTop: 4 }}>
              <Avatar name={reported?.full_name} src={reported?.avatar_url} size={36} />
              <div>
                <div className="user-name">{reported?.full_name || '(Ẩn danh)'}</div>
                {reported?.is_active === false && (
                  <div className="muted" style={{ fontSize: 12, color: '#b91c1c' }}>Tài khoản đã bị khoá</div>
                )}
              </div>
            </div>
          ) : (
            <span className="muted">—</span>
          )}
        </div>

        {report.donation_id?.title && (
          <div className="field">
            <span className="field-label">Đơn liên quan</span>
            <span style={{ fontSize: 14 }}>{report.donation_id.title}</span>
          </div>
        )}

        <div className="field">
          <span className="field-label">Lý do</span>
          <span style={{ fontSize: 14 }}>{REASON_LABEL[report.reason ?? ''] || report.reason}</span>
        </div>

        <div className="field">
          <span className="field-label">Mô tả</span>
          <span style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {report.description || <em className="muted">Không có</em>}
          </span>
        </div>

        <div className="field">
          <span className="field-label">Trạng thái</span>
          <div style={{ marginTop: 4 }}><StatusBadge status={report.status} /></div>
        </div>

        <div className="field">
          <span className="field-label">Thời gian</span>
          <span>{formatDateTime(report.createdAt)}</span>
        </div>

        {isPending ? (
          <>
            <div className="field">
              <span className="field-label">Quyết định xử lý</span>
              <select
                className="input"
                value={decision}
                onChange={(e) => setDecision(e.target.value as 'RESOLVED' | 'DISMISSED')}
                style={{ marginTop: 4 }}
              >
                <option value="RESOLVED">Đã xử lý (có biện pháp)</option>
                <option value="DISMISSED">Bỏ qua (không vi phạm)</option>
              </select>
            </div>
            {decision === 'RESOLVED' && (
              <div className="field">
                <span className="field-label">Hành động</span>
                <select
                  className="input"
                  value={action}
                  onChange={(e) => setAction(e.target.value as ReportAction)}
                  style={{ marginTop: 4 }}
                >
                  <option value="NONE">Không (chỉ ghi nhận)</option>
                  <option value="WARN">Cảnh báo người đăng</option>
                  {report.donation_id && <option value="REMOVE_DONATION">Gỡ đơn vi phạm</option>}
                  <option value="LOCK_USER">Khoá tài khoản người đăng</option>
                </select>
                <span className="muted" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  Hành động sẽ gửi thông báo cho người bị xử lý.
                </span>
              </div>
            )}
            <div className="field">
              <span className="field-label">Ghi chú xử lý</span>
              <textarea
                className="input"
                rows={3}
                placeholder="Ghi chú biện pháp đã áp dụng..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ marginTop: 4, resize: 'vertical' }}
              />
            </div>
          </>
        ) : (
          <>
            {report.action_taken && report.action_taken !== 'NONE' && (
              <div className="field">
                <span className="field-label">Hành động đã áp dụng</span>
                <span style={{ fontSize: 14 }}>{ACTION_LABEL[report.action_taken]}</span>
              </div>
            )}
            {report.admin_note && (
              <div className="field">
                <span className="field-label">Ghi chú xử lý</span>
                <span style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{report.admin_note}</span>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
