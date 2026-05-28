import type { DonationStatus, FoodType, RequestStatus, UserRole } from '../types';

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(date);
}

export function formatNumber(value?: number | null): string {
  return (value ?? 0).toLocaleString('vi-VN');
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Admin',
  DONOR: 'Donor',
  RECEIVER: 'Receiver',
  VOLUNTEER: 'Volunteer',
  UNSET: 'Chưa thiết lập',
};

export function roleLabel(role?: UserRole | null): string {
  if (!role) return ROLE_LABEL.UNSET;
  return ROLE_LABEL[role] || role;
}

const DONATION_STATUS_LABEL: Record<DonationStatus, string> = {
  PENDING: 'Chờ tiếp nhận',
  ACCEPTED: 'Đã nhận',
  PICKED_UP: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  EXPIRED: 'Quá hạn',
  CANCELLED: 'Đã huỷ',
};

export function donationStatusLabel(status?: DonationStatus | null): string {
  if (!status) return '—';
  return DONATION_STATUS_LABEL[status] || status;
}

const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Đang chờ',
  ACCEPTED: 'Đã nhận',
  FULFILLED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
};

export function requestStatusLabel(status?: RequestStatus | null): string {
  if (!status) return '—';
  return REQUEST_STATUS_LABEL[status] || status;
}

const FOOD_TYPE_LABEL: Record<FoodType, string> = {
  COOKED: 'Đồ ăn nấu chín',
  RAW: 'Rau / nguyên liệu',
  FROZEN: 'Đông lạnh',
  PACKAGED: 'Đóng gói',
};

export function foodTypeLabel(value?: FoodType | null): string {
  if (!value) return '—';
  return FOOD_TYPE_LABEL[value] || value;
}

export const DONATION_STATUSES: DonationStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PICKED_UP',
  'COMPLETED',
  'EXPIRED',
  'CANCELLED',
];

export const REQUEST_STATUSES: RequestStatus[] = ['PENDING', 'ACCEPTED', 'FULFILLED', 'CANCELLED'];

export const USER_ROLES: UserRole[] = ['ADMIN', 'DONOR', 'RECEIVER', 'VOLUNTEER', 'UNSET'];
