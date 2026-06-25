import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, Star } from 'lucide-react';
import { listFeedback } from '../api/endpoints';
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
import type { FeedbackRecord } from '../types';

function StarRating({ value }: { value?: number }) {
  const stars = Math.round(value ?? 0);
  return (
    <span title={`${stars}/5`} style={{ color: '#f59e0b', letterSpacing: 2, fontSize: 15 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

type RatingFilter = 'ALL' | '5' | '4' | '3' | '2' | '1';

const RATING_FILTERS: { label: string; value: RatingFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: '5★', value: '5' },
  { label: '4★', value: '4' },
  { label: '3★', value: '3' },
  { label: '2★', value: '2' },
  { label: '1★', value: '1' },
];

export function FeedbackPage() {
  const toast = useToast();
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('ALL');
  const [detail, setDetail] = useState<FeedbackRecord | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listFeedback();
      setFeedbacks(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const avgRating = useMemo(() => {
    const valid = feedbacks.filter((f) => typeof f.rating === 'number');
    if (!valid.length) return null;
    return (valid.reduce((s, f) => s + (f.rating ?? 0), 0) / valid.length).toFixed(1);
  }, [feedbacks]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return feedbacks.filter((f) => {
      if (ratingFilter !== 'ALL' && String(Math.round(f.rating ?? 0)) !== ratingFilter) return false;
      if (!kw) return true;
      const from = f.from_user_id?.full_name ?? '';
      const to = f.to_user_id?.full_name ?? '';
      const comment = f.comment ?? '';
      return [from, to, comment].join(' ').toLowerCase().includes(kw);
    });
  }, [feedbacks, keyword, ratingFilter]);

  const { page, setPage, pageSize, total, totalPages, pageItems } = usePagination(filtered, {
    pageSize: 10,
    resetKey: `${keyword}|${ratingFilter}`,
  });

  return (
    <>
      <PageHeader
        title="Quản lý Feedback"
        subtitle={
          avgRating
            ? `${feedbacks.length} đánh giá · Trung bình ${avgRating}★`
            : `${feedbacks.length} đánh giá`
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
              placeholder="Tìm theo tên người dùng, nội dung..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="chip-row">
            {RATING_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`chip${ratingFilter === f.value ? ' active' : ''}`}
                onClick={() => setRatingFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><Spinner label="Đang tải feedback..." /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Star size={28} />} title="Không có feedback phù hợp" description="Thử bỏ filter hoặc tìm kiếm khác." />
        ) : (
          <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Người đánh giá</th>
                  <th>Người được đánh giá</th>
                  <th>Sao</th>
                  <th>Nội dung</th>
                  <th>Ngày</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((f) => {
                  const from = f.from_user_id;
                  const to = f.to_user_id;
                  return (
                    <tr key={f._id}>
                      <td>
                        <div className="user-cell">
                          <Avatar name={from?.full_name} src={from?.avatar_url} size={32} />
                          <div>
                            <div className="user-name">{from?.full_name || '(Ẩn danh)'}</div>
                            {from?.role && (
                              <div style={{ marginTop: 2 }}><RolePill role={from.role} /></div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <Avatar name={to?.full_name} src={to?.avatar_url} size={32} />
                          <div>
                            <div className="user-name">{to?.full_name || '(Ẩn danh)'}</div>
                            {to?.role && (
                              <div style={{ marginTop: 2 }}><RolePill role={to.role} /></div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><StarRating value={f.rating} /></td>
                      <td>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {f.comment
                            ? f.comment.length > 60
                              ? `${f.comment.slice(0, 60)}…`
                              : f.comment
                            : <em>Không có</em>}
                        </span>
                      </td>
                      <td>{formatDateTime(f.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '2px 8px' }}
                          onClick={() => setDetail(f)}
                        >
                          Chi tiết
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

      <FeedbackDetailModal feedback={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function FeedbackDetailModal({
  feedback,
  onClose,
}: {
  feedback: FeedbackRecord | null;
  onClose: () => void;
}) {
  if (!feedback) return null;
  const from = feedback.from_user_id;
  const to = feedback.to_user_id;

  return (
    <Modal
      open
      title="Chi tiết Feedback"
      description={feedback._id}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      }
    >
      <div className="form-grid">
        <div className="field">
          <span className="field-label">Người đánh giá</span>
          <div className="user-cell" style={{ marginTop: 4 }}>
            <Avatar name={from?.full_name} src={from?.avatar_url} size={36} />
            <div>
              <div className="user-name">{from?.full_name || '(Ẩn danh)'}</div>
              {from?.role && <div style={{ marginTop: 2 }}><RolePill role={from.role} /></div>}
            </div>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Người được đánh giá</span>
          <div className="user-cell" style={{ marginTop: 4 }}>
            <Avatar name={to?.full_name} src={to?.avatar_url} size={36} />
            <div>
              <div className="user-name">{to?.full_name || '(Ẩn danh)'}</div>
              {to?.role && <div style={{ marginTop: 2 }}><RolePill role={to.role} /></div>}
            </div>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Đánh giá</span>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarRating value={feedback.rating} />
            <span className="muted" style={{ fontSize: 13 }}>({feedback.rating ?? 0}/5)</span>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Nội dung</span>
          <span style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {feedback.comment || <em className="muted">Không có nhận xét</em>}
          </span>
        </div>

        {feedback.delivery_id && (
          <div className="field">
            <span className="field-label">Delivery ID</span>
            <span className="muted" style={{ fontSize: 12 }}>{feedback.delivery_id}</span>
          </div>
        )}

        <div className="field">
          <span className="field-label">Thời gian</span>
          <span>{formatDateTime(feedback.createdAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
