import { useEffect, useMemo, useState } from 'react';
import { Clock, Eye, HandHeart, MapPin, RefreshCcw, Search, Utensils } from 'lucide-react';
import { listDonations } from '../api/endpoints';
import { getErrorMessage, resolveAssetUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { DonationStatusPill } from '../components/StatusPill';
import {
  DONATION_STATUSES,
  cancelReasonLabel,
  donationStatusLabel,
  foodTypeLabel,
  formatDateTime,
  formatNumber,
} from '../utils/format';
import type { DonationRecord, DonationStatus } from '../types';

const STATUS_TABS: { label: string; value: DonationStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  ...DONATION_STATUSES.map((status) => ({ label: donationStatusLabel(status), value: status })),
];

export function DonationsPage() {
  const toast = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DonationStatus | 'ALL'>('ALL');
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState<DonationRecord | null>(null);

  const loadDonations = async (filter: DonationStatus | 'ALL') => {
    setLoading(true);
    try {
      const data = await listDonations(filter === 'ALL' ? undefined : filter);
      setDonations(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDonations(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return donations;
    return donations.filter((donation) => {
      const haystack = [
        donation.title || '',
        donation.donor_id?.full_name || '',
        donation.pickup_address_line || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(kw);
    });
  }, [donations, keyword]);

  return (
    <>
      <PageHeader
        title="Quản lý donations"
        subtitle={`${formatNumber(donations.length)} đơn ${statusFilter === 'ALL' ? '' : '· ' + donationStatusLabel(statusFilter)}`}
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void loadDonations(statusFilter)}
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
              placeholder="Tìm theo tiêu đề, donor, địa chỉ..."
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
            <Spinner label="Đang tải donations..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<HandHeart size={28} />}
            title="Không có donation"
            description="Hãy thử bộ lọc khác hoặc xoá từ khoá tìm kiếm."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Donor</th>
                  <th>Số lượng</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th>Tạo lúc</th>
                  <th>Hết hạn</th>
                  <th aria-label="Chi tiết" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((donation) => (
                  <tr key={donation._id}>
                    <td>
                      <div className="cell-strong">{donation.title || '(Không tiêu đề)'}</div>
                      <div className="muted small">{donation._id}</div>
                    </td>
                    <td>{donation.donor_id?.full_name || '—'}</td>
                    <td>
                      {formatNumber(donation.quantity)} {donation.unit || 'phần'}
                    </td>
                    <td>{foodTypeLabel(donation.food_type)}</td>
                    <td>
                      <DonationStatusPill status={donation.status} />
                    </td>
                    <td>{formatDateTime(donation.createdAt)}</td>
                    <td>{formatDateTime(donation.expiration_datetime)}</td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setDetail(donation)}
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
        title={detail?.title || 'Chi tiết donation'}
        description={detail?._id}
        onClose={() => setDetail(null)}
        size="lg"
      >
        {detail ? (
          <div className="detail-sections">
            {/* Thực phẩm */}
            <section>
              <p className="detail-section-title">
                <Utensils size={14} /> Thông tin thực phẩm
              </p>
              <div className="detail-grid">
                <DetailRow label="Số lượng">
                  {formatNumber(detail.quantity)} {detail.unit || 'phần'}
                </DetailRow>
                <DetailRow label="Loại thực phẩm">{foodTypeLabel(detail.food_type)}</DetailRow>
                {detail.description ? (
                  <DetailRow label="Mô tả" full>
                    {detail.description}
                  </DetailRow>
                ) : null}
                {detail.images?.length ? (
                  <DetailRow label="Hình ảnh" full>
                    <div className="image-row">
                      {detail.images.map((url) => (
                        <img key={url} src={resolveAssetUrl(url)} alt="Donation" className="image-thumb" />
                      ))}
                    </div>
                  </DetailRow>
                ) : null}
              </div>
            </section>

            {/* Người tặng & Giao nhận */}
            <section>
              <p className="detail-section-title">
                <MapPin size={14} /> Người tặng & Giao nhận
              </p>
              <div className="detail-grid">
                <DetailRow label="Donor">{detail.donor_id?.full_name || '—'}</DetailRow>
                <DetailRow label="Volunteer">{detail.volunteer_id?.full_name || '—'}</DetailRow>
                <DetailRow label="Hình thức giao">{detail.delivery_type || '—'}</DetailRow>
                <DetailRow label="Địa chỉ pickup" full>
                  {detail.pickup_address_line || '—'}
                  {detail.pickup_city ? `, ${detail.pickup_city}` : ''}
                </DetailRow>
              </div>
            </section>

            {/* Trạng thái & Thời gian */}
            <section>
              <p className="detail-section-title">
                <Clock size={14} /> Trạng thái & Thời gian
              </p>
              <div className="detail-grid">
                <DetailRow label="Trạng thái">
                  <DonationStatusPill status={detail.status} />
                </DetailRow>
                {detail.status === 'CANCELLED' ? (
                  <>
                    <DetailRow label="Lý do huỷ" full>
                      {cancelReasonLabel(detail.cancel_reason)}
                    </DetailRow>
                    {detail.cancelled_at ? (
                      <DetailRow label="Thời điểm huỷ">{formatDateTime(detail.cancelled_at)}</DetailRow>
                    ) : null}
                  </>
                ) : null}
                <DetailRow label="Hết hạn">{formatDateTime(detail.expiration_datetime)}</DetailRow>
                <DetailRow label="Tạo lúc">{formatDateTime(detail.createdAt)}</DetailRow>
                <DetailRow label="Cập nhật">{formatDateTime(detail.updatedAt)}</DetailRow>
              </div>
            </section>
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
