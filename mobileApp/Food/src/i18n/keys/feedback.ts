export type FeedbackKey =
  | 'feedback.title'
  | 'feedback.congrats'
  | 'feedback.delivered'
  | 'feedback.youEarned'
  | 'feedback.points'
  | 'feedback.forReducing'
  | 'feedback.deliveryPrefix'
  | 'feedback.notCompleted'
  | 'feedback.thankAgent'
  | 'feedback.ratePrefix'
  | 'feedback.volunteerSuffix'
  | 'feedback.donorSuffix'
  | 'feedback.commentOptional'
  | 'feedback.typePlaceholder'
  | 'feedback.contributeOptional'
  | 'feedback.tipPlaceholder'
  | 'feedback.noVolunteer'
  | 'feedback.thankDonor'
  | 'feedback.feedbackLabel'
  | 'feedback.submitting'
  | 'feedback.submit'
  | 'feedback.cannotLoad'
  | 'feedback.missingDonation'
  | 'feedback.missingDonationMsg'
  | 'feedback.incomplete'
  | 'feedback.incompleteMsg'
  | 'feedback.successTitle'
  | 'feedback.successMsg'
  | 'feedback.cannotSubmit';

export const feedbackEn: Record<FeedbackKey, string> = {
  'feedback.title': 'Feedback',
  'feedback.congrats': 'Congrats!',
  'feedback.delivered': 'Your food is delivered',
  'feedback.youEarned': 'You have earned',
  'feedback.points': 'points',
  'feedback.forReducing': 'for helping reduce food waste',
  'feedback.deliveryPrefix': 'Delivery:',
  'feedback.notCompleted': 'Feedback is available only after delivery is completed.',
  'feedback.thankAgent': 'Show your gratitude to Delivery Agent',
  'feedback.ratePrefix': 'Rate',
  'feedback.volunteerSuffix': '(Volunteer)',
  'feedback.donorSuffix': '(Donor)',
  'feedback.commentOptional': 'Comment (optional)',
  'feedback.typePlaceholder': 'Type...',
  'feedback.contributeOptional': 'Contribute via money (optional)',
  'feedback.tipPlaceholder': '+Tip',
  'feedback.noVolunteer': 'No volunteer was assigned for this delivery.',
  'feedback.thankDonor': 'Show your gratitude to Donor',
  'feedback.feedbackLabel': 'Feedback',
  'feedback.submitting': 'Submitting...',
  'feedback.submit': 'Submit',
  'feedback.cannotLoad': 'Cannot load feedback',
  'feedback.missingDonation': 'Missing donation',
  'feedback.missingDonationMsg': 'Donation id is not available.',
  'feedback.incomplete': 'Incomplete feedback',
  'feedback.incompleteMsg': 'Please provide required ratings before submit.',
  'feedback.successTitle': 'Success',
  'feedback.successMsg': 'Feedback submitted successfully.',
  'feedback.cannotSubmit': 'Cannot submit',
};

export const feedbackVi: Record<FeedbackKey, string> = {
  'feedback.title': 'Đánh giá',
  'feedback.congrats': 'Chúc mừng!',
  'feedback.delivered': 'Thực phẩm của bạn đã được giao',
  'feedback.youEarned': 'Bạn đã nhận được',
  'feedback.points': 'điểm',
  'feedback.forReducing': 'vì đã giúp giảm lãng phí thực phẩm',
  'feedback.deliveryPrefix': 'Đơn giao:',
  'feedback.notCompleted': 'Đánh giá chỉ khả dụng sau khi giao hàng hoàn tất.',
  'feedback.thankAgent': 'Bày tỏ lòng biết ơn với tình nguyện viên giao hàng',
  'feedback.ratePrefix': 'Đánh giá',
  'feedback.volunteerSuffix': '(Tình nguyện viên)',
  'feedback.donorSuffix': '(Người tặng)',
  'feedback.commentOptional': 'Nhận xét (tuỳ chọn)',
  'feedback.typePlaceholder': 'Nhập...',
  'feedback.contributeOptional': 'Đóng góp tiền (tuỳ chọn)',
  'feedback.tipPlaceholder': '+Tiền thưởng',
  'feedback.noVolunteer': 'Không có tình nguyện viên nào cho đơn này.',
  'feedback.thankDonor': 'Bày tỏ lòng biết ơn với người tặng',
  'feedback.feedbackLabel': 'Nhận xét',
  'feedback.submitting': 'Đang gửi...',
  'feedback.submit': 'Gửi',
  'feedback.cannotLoad': 'Không thể tải đánh giá',
  'feedback.missingDonation': 'Thiếu ID bài ủng hộ',
  'feedback.missingDonationMsg': 'ID bài ủng hộ không có.',
  'feedback.incomplete': 'Chưa đủ thông tin',
  'feedback.incompleteMsg': 'Vui lòng điền đủ đánh giá trước khi gửi.',
  'feedback.successTitle': 'Thành công',
  'feedback.successMsg': 'Đánh giá đã được gửi thành công.',
  'feedback.cannotSubmit': 'Không thể gửi',
};
