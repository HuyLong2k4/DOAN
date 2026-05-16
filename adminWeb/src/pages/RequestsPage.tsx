import { useEffect, useMemo, useState } from 'react';
import { Eye, HeartHandshake, RefreshCcw, Search } from 'lucide-react';
import { listRequests } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { RequestStatusPill } from '../components/StatusPill';
import {
  REQUEST_STATUSES,
  foodTypeLabel,
  formatDateTime,
  formatNumber,
  requestStatusLabel,
} from '../utils/format';
import type { RequestRecord, RequestStatus } from '../types';

const STATUS_TABS: { label: string; value: RequestStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  ...REQUEST_STATUSES.map((status) => ({ label: requestStatusLabel(status), value: status })),
];

export function RequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState<RequestRecord | null>(null);

  const loadRequests = async (filter: RequestStatus | 'ALL') => {
    setLoading(true);
    try {
      const data = await listRequests(filter === 'ALL' ? undefined : filter);
      setRequests(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return requests;
    return requests.filter((request) => {
      const haystack = [request.title || '', request.receiver_id?.full_name || '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(kw);
    });
  }, [requests, keyword]);

  return (
    <>
      <PageHeader
        title="Quản lý requests"
        subtitle={`${formatNumber(requests.length)} yêu cầu ${statusFilter === 'ALL' ? '' : '· ' + requestStatusLabel(statusFilter)}`}
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void loadRequests(statusFilter)}
          >
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
              placeholder="Tìm theo tiêu đề hoặc receiver..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="chip-row">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`chip${statusFilter === tab.value ? ' active' : ''}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <Spinner label="Đang tải requests..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<HeartHandshake size={28} />}
            title="Không có request"
            description="Hãy thử bộ lọc khác hoặc xoá từ khoá tìm kiếm."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Receiver</th>
                  <th>Số lượng</th>
                  <th>Trạng thái</th>
                  <th>Cần trước</th>
                  <th>Tạo lúc</th>
                  <th aria-label="Chi tiết" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <div className="cell-strong">{request.title || '(Không tiêu đề)'}</div>
                      <div className="muted small">{request._id}</div>
                    </td>
                    <td>{request.receiver_id?.full_name || '—'}</td>
                    <td>
                      {formatNumber(request.requested_quantity)} {request.unit || 'phần'}
                    </td>
                    <td>
                      <RequestStatusPill status={request.status} />
                    </td>
                    <td>{formatDateTime(request.needed_before)}</td>
                    <td>{formatDateTime(request.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setDetail(request)}
                        title="Chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={Boolean(detail)}
        title={detail?.title || 'Chi tiết request'}
        description={detail?._id}
        onClose={() => setDetail(null)}
        size="lg"
      >
        {detail ? (
          <div className="detail-grid">
            <DetailRow label="Receiver">{detail.receiver_id?.full_name || '—'}</DetailRow>
            <DetailRow label="Trạng thái">
              <RequestStatusPill status={detail.status} />
            </DetailRow>
            <DetailRow label="Số lượng">
              {formatNumber(detail.requested_quantity)} {detail.unit || 'phần'}
            </DetailRow>
            <DetailRow label="Loại thực phẩm">{foodTypeLabel(detail.food_type)}</DetailRow>
            <DetailRow label="Cần trước">{formatDateTime(detail.needed_before)}</DetailRow>
            <DetailRow label="Tạo lúc">{formatDateTime(detail.createdAt)}</DetailRow>
            <DetailRow label="Cập nhật">{formatDateTime(detail.updatedAt)}</DetailRow>

            {detail.description ? (
              <DetailRow label="Mô tả" full>
                {detail.description}
              </DetailRow>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}

function DetailRow({ label, children, full }: DetailRowProps) {
  return (
    <div className={`detail-row${full ? ' detail-full' : ''}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{children}</span>
    </div>
  );
}
