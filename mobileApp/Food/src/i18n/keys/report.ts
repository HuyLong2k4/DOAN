export type ReportKey =
  | 'report.button'
  | 'report.modalTitle'
  | 'report.reasonLabel'
  | 'report.reason.SPOILED'
  | 'report.reason.EXPIRED_UNSAFE'
  | 'report.reason.WRONG_INFO'
  | 'report.reason.FRAUD'
  | 'report.reason.INAPPROPRIATE'
  | 'report.reason.OTHER'
  | 'report.descLabel'
  | 'report.descPlaceholder'
  | 'report.submit'
  | 'report.submitting'
  | 'report.cancel'
  | 'report.reasonRequired'
  | 'report.successTitle'
  | 'report.successMsg'
  | 'report.failedTitle';

export const reportEn: Record<ReportKey, string> = {
  'report.button': 'Report violation',
  'report.modalTitle': 'Report a violation',
  'report.reasonLabel': 'Reason',
  'report.reason.SPOILED': 'Spoiled / rotten food',
  'report.reason.EXPIRED_UNSAFE': 'Expired / unsafe',
  'report.reason.WRONG_INFO': 'Misleading information',
  'report.reason.FRAUD': 'Signs of fraud',
  'report.reason.INAPPROPRIATE': 'Inappropriate content',
  'report.reason.OTHER': 'Other',
  'report.descLabel': 'Description (optional)',
  'report.descPlaceholder': 'Describe the issue in detail...',
  'report.submit': 'Send report',
  'report.submitting': 'Sending...',
  'report.cancel': 'Cancel',
  'report.reasonRequired': 'Please select a reason.',
  'report.successTitle': 'Report sent',
  'report.successMsg': 'Thank you. An administrator will review it.',
  'report.failedTitle': 'Could not send report',
};

export const reportVi: Record<ReportKey, string> = {
  'report.button': 'Báo cáo vi phạm',
  'report.modalTitle': 'Báo cáo vi phạm',
  'report.reasonLabel': 'Lý do',
  'report.reason.SPOILED': 'Thực phẩm hỏng / ôi thiu',
  'report.reason.EXPIRED_UNSAFE': 'Quá hạn / không an toàn',
  'report.reason.WRONG_INFO': 'Thông tin sai lệch',
  'report.reason.FRAUD': 'Có dấu hiệu gian lận',
  'report.reason.INAPPROPRIATE': 'Nội dung không phù hợp',
  'report.reason.OTHER': 'Khác',
  'report.descLabel': 'Mô tả (tuỳ chọn)',
  'report.descPlaceholder': 'Mô tả chi tiết vấn đề...',
  'report.submit': 'Gửi báo cáo',
  'report.submitting': 'Đang gửi...',
  'report.cancel': 'Huỷ',
  'report.reasonRequired': 'Vui lòng chọn lý do.',
  'report.successTitle': 'Đã gửi báo cáo',
  'report.successMsg': 'Cảm ơn bạn. Quản trị viên sẽ xem xét.',
  'report.failedTitle': 'Không gửi được báo cáo',
};
