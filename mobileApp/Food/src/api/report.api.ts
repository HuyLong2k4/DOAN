import { http } from './http';

export type ReportReason =
  | 'SPOILED'
  | 'EXPIRED_UNSAFE'
  | 'WRONG_INFO'
  | 'FRAUD'
  | 'INAPPROPRIATE'
  | 'OTHER';

export type SubmitReportPayload = {
  donation_id?: string;
  reported_user_id?: string;
  reason: ReportReason;
  description?: string;
};

// Gửi báo cáo vi phạm về một đơn quyên góp hoặc người dùng.
export function submitReport(payload: SubmitReportPayload) {
  return http.post('/reports', payload);
}
