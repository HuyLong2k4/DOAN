import type { ReactNode } from 'react';
import type { DonationStatus, RequestStatus, UserRole, VerificationStatus } from '../types';
import { donationStatusLabel, requestStatusLabel, roleLabel, verificationLabel } from '../utils/format';

const ROLE_CLASS: Record<UserRole, string> = {
  ADMIN: 'pill-admin',
  DONOR: 'pill-donor',
  RECEIVER: 'pill-receiver',
  VOLUNTEER: 'pill-volunteer',
  UNSET: 'pill-muted',
};

const DONATION_CLASS: Record<DonationStatus, string> = {
  PENDING: 'pill-warning',
  ACCEPTED: 'pill-info',
  PICKED_UP: 'pill-info',
  COMPLETED: 'pill-success',
  EXPIRED: 'pill-muted',
  CANCELLED: 'pill-danger',
};

const REQUEST_CLASS: Record<RequestStatus, string> = {
  PENDING: 'pill-warning',
  ACCEPTED: 'pill-info',
  FULFILLED: 'pill-success',
  CANCELLED: 'pill-danger',
};

interface PillProps {
  className: string;
  children: ReactNode;
}

function Pill({ className, children }: PillProps) {
  return <span className={`pill ${className}`}>{children}</span>;
}

export function RolePill({ role }: { role?: UserRole | null }) {
  const variant = ROLE_CLASS[(role || 'UNSET') as UserRole] || 'pill-muted';
  return <Pill className={variant}>{roleLabel(role)}</Pill>;
}

export function DonationStatusPill({ status }: { status?: DonationStatus | null }) {
  if (!status) return <Pill className="pill-muted">—</Pill>;
  return <Pill className={DONATION_CLASS[status] || 'pill-muted'}>{donationStatusLabel(status)}</Pill>;
}

export function RequestStatusPill({ status }: { status?: RequestStatus | null }) {
  if (!status) return <Pill className="pill-muted">—</Pill>;
  return <Pill className={REQUEST_CLASS[status] || 'pill-muted'}>{requestStatusLabel(status)}</Pill>;
}

const VERIFICATION_CLASS: Record<VerificationStatus, string> = {
  PENDING: 'pill-warning',
  APPROVED: 'pill-success',
  REJECTED: 'pill-danger',
};

export function VerificationPill({ status }: { status?: VerificationStatus | null }) {
  if (!status) return <Pill className="pill-muted">—</Pill>;
  return <Pill className={VERIFICATION_CLASS[status] || 'pill-muted'}>{verificationLabel(status)}</Pill>;
}
