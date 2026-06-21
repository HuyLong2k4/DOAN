/**
 * i18n cho thông báo (in-app + push). Thông báo được render ở backend theo
 * ngôn ngữ (User.language) của TỪNG người nhận, nên cùng một sự kiện có thể gửi
 * tiếng Việt cho người này và tiếng Anh cho người kia.
 *
 * Mỗi key có dạng { vi: { title, body }, en: { title, body } }. Trong title/body
 * dùng placeholder `{param}` — được thay bằng giá trị truyền vào lúc dispatch.
 *
 * Lưu ý: nội dung do người dùng tạo (tin nhắn chat) KHÔNG nằm ở đây — nó hiển thị
 * nguyên văn, không dịch.
 */

const DICT = {
  // ── Donor actions ─────────────────────────────────────────────
  'donation.cancelledByDonor': {
    vi: { title: 'Đơn đã bị huỷ', body: 'Donor đã huỷ đơn "{title}".' },
    en: { title: 'Donation cancelled', body: 'The donor cancelled "{title}".' },
  },
  'donation.releasedByDonor.request': {
    vi: { title: 'Đơn đã bị huỷ', body: 'Donor huỷ đơn "{title}" vì quá 30 phút chưa được lấy. Yêu cầu của bạn đã được mở lại.' },
    en: { title: 'Donation cancelled', body: 'The donor cancelled "{title}" — not picked up within 30 minutes. Your request has been reopened.' },
  },
  'donation.releasedByDonor.public': {
    vi: { title: 'Donor đã giải phóng đơn', body: 'Donor huỷ kết nối với đơn "{title}" vì quá 30 phút chưa được lấy.' },
    en: { title: 'Released from donation', body: 'The donor disconnected you from "{title}" — not picked up within 30 minutes.' },
  },

  // ── Receiver actions ──────────────────────────────────────────
  'donation.connectedToDonor': {
    vi: { title: 'Receiver đã kết nối đơn của bạn', body: '{receiverName} đã kết nối và được chốt cho đơn "{title}".' },
    en: { title: 'A receiver connected to your donation', body: '{receiverName} connected and was matched for "{title}".' },
  },
  'donation.connectApproved': {
    vi: { title: 'Kết nối thành công', body: 'Bạn đã được chốt cho đơn "{title}". Hãy chọn cách nhận hàng.' },
    en: { title: 'Connected successfully', body: 'You were matched for "{title}". Please choose a delivery method.' },
  },
  'delivery.choiceViaAgent': {
    vi: { title: 'Receiver đã chọn cách nhận hàng', body: '{receiverName} chọn uỷ thác volunteer cho đơn "{title}".' },
    en: { title: 'Receiver chose a delivery method', body: '{receiverName} chose volunteer delivery for "{title}".' },
  },
  'delivery.choiceSelfPickup': {
    vi: { title: 'Receiver đã chọn cách nhận hàng', body: '{receiverName} chọn tự lấy hàng cho đơn "{title}".' },
    en: { title: 'Receiver chose a delivery method', body: '{receiverName} chose self pickup for "{title}".' },
  },
  'volunteer.broadcast': {
    vi: { title: 'Có đơn cần volunteer gần bạn', body: 'Đơn "{title}" gần bạn đang cần volunteer giao.' },
    en: { title: 'A donation near you needs a volunteer', body: '"{title}" near you needs a volunteer to deliver.' },
  },
  'donation.receiverDisconnected.request': {
    vi: { title: 'Receiver đã rút yêu cầu', body: 'Receiver đã rút khỏi yêu cầu "{title}". Yêu cầu đã được mở lại.' },
    en: { title: 'Receiver withdrew the request', body: 'The receiver withdrew from "{title}". The request has been reopened.' },
  },
  'donation.receiverDisconnected.public': {
    vi: { title: 'Receiver đã rút khỏi đơn', body: 'Receiver đã rút khỏi đơn "{title}". Đơn sẵn sàng cho receiver khác.' },
    en: { title: 'Receiver withdrew from the donation', body: 'The receiver withdrew from "{title}". It is open for another receiver.' },
  },
  'volunteer.noShowReported': {
    vi: { title: 'Volunteer không giao đến', body: 'Receiver báo volunteer không đến giao đơn "{title}". Đơn đã bị huỷ.' },
    en: { title: 'Volunteer did not deliver', body: 'The receiver reported the volunteer never delivered "{title}". The donation was cancelled.' },
  },
  'selfPickup.completed': {
    vi: { title: 'Receiver đã tự lấy hàng', body: '{receiverName} đã xác nhận tự lấy hàng cho đơn "{title}".' },
    en: { title: 'Receiver picked up the food', body: '{receiverName} confirmed self pickup for "{title}".' },
  },

  // ── Volunteer actions ─────────────────────────────────────────
  'volunteer.releasedDonation': {
    vi: { title: 'Volunteer trả lại đơn', body: 'Volunteer không thể giao "{title}". Đơn đang tìm volunteer khác.' },
    en: { title: 'Volunteer released the donation', body: 'The volunteer could not deliver "{title}". Finding another volunteer.' },
  },
  'volunteer.pickupStarted': {
    vi: { title: 'Đơn đang trên đường giao', body: '{volunteerName} đã lấy hàng và đang giao đơn "{title}".' },
    en: { title: 'Your order is on the way', body: '{volunteerName} picked up and is delivering "{title}".' },
  },
  'volunteer.delivered': {
    vi: { title: 'Đã giao hàng', body: '{volunteerName} báo đã giao đơn "{title}". Vui lòng xác nhận đã nhận hàng.' },
    en: { title: 'Delivered', body: '{volunteerName} marked "{title}" as delivered. Please confirm you received it.' },
  },

  // ── Confirm / completion ──────────────────────────────────────
  'delivery.confirmed.auto': {
    vi: { title: 'Đơn đã tự động xác nhận', body: 'Đơn "{title}" được tự động xác nhận sau 24h không phản hồi.' },
    en: { title: 'Order auto-confirmed', body: '"{title}" was auto-confirmed after 24h with no response.' },
  },
  'delivery.confirmed.manual': {
    vi: { title: 'Receiver đã xác nhận đã nhận hàng', body: 'Đơn "{title}" đã hoàn tất.' },
    en: { title: 'Receiver confirmed delivery', body: '"{title}" is complete.' },
  },

  // ── Maintenance / cron ────────────────────────────────────────
  'donation.expired.donor': {
    vi: { title: 'Đơn quyên góp đã hết hạn', body: 'Đơn "{title}" đã hết hạn và chuyển sang trạng thái EXPIRED.' },
    en: { title: 'Donation expired', body: '"{title}" expired and was moved to EXPIRED.' },
  },
  'donation.expired.receiver': {
    vi: { title: 'Đơn đã hết hạn', body: 'Đơn "{title}" đã hết hạn.' },
    en: { title: 'Donation expired', body: '"{title}" has expired.' },
  },
  'donation.expiredSelfPickup': {
    vi: { title: 'Đơn đã hết hạn', body: 'Đơn "{title}" hết hạn do chưa được lấy.' },
    en: { title: 'Donation expired', body: '"{title}" expired because it was not picked up.' },
  },
  'delivery.autoCancelledNoShow': {
    vi: { title: 'Đơn đã bị huỷ', body: 'Đơn "{title}" quá {hours}h chưa giao, đã tự động huỷ.' },
    en: { title: 'Order cancelled', body: '"{title}" was not delivered within {hours}h and was auto-cancelled.' },
  },

  // ── Food requests ─────────────────────────────────────────────
  'request.new': {
    vi: { title: 'Có yêu cầu mới', body: '{receiverName} vừa tạo yêu cầu cần {qty}.' },
    en: { title: 'New food request', body: '{receiverName} just created a request for {qty}.' },
  },
  'request.accepted': {
    vi: { title: 'Yêu cầu đã được tiếp nhận', body: '{donorName} đã tiếp nhận yêu cầu của bạn. Hãy chọn cách nhận hàng.' },
    en: { title: 'Request accepted', body: '{donorName} accepted your request. Please choose a delivery method.' },
  },

  // ── Feedback ──────────────────────────────────────────────────
  'feedback.received': {
    vi: { title: 'Bạn nhận được đánh giá mới', body: '{receiverName} đánh giá {rating}/5 sao cho đơn "{title}".' },
    en: { title: 'You received a new review', body: '{receiverName} rated {rating}/5 stars for "{title}".' },
  },
  'feedback.receivedWithComment': {
    vi: { title: 'Bạn nhận được đánh giá mới', body: '{receiverName} đánh giá {rating}/5 sao cho đơn "{title}". "{comment}"' },
    en: { title: 'You received a new review', body: '{receiverName} rated {rating}/5 stars for "{title}". "{comment}"' },
  },

  // ── Report / kiểm duyệt ───────────────────────────────────────
  'report.warned': {
    vi: { title: 'Cảnh báo từ quản trị viên', body: 'Đơn "{title}" của bạn bị phản ánh về an toàn thực phẩm. Vui lòng tuân thủ quy định khi đăng đơn.' },
    en: { title: 'Warning from admin', body: 'Your donation "{title}" was reported for a food-safety concern. Please follow the rules when posting.' },
  },
  'report.warnedUser': {
    vi: { title: 'Cảnh báo từ quản trị viên', body: 'Tài khoản của bạn bị phản ánh vi phạm quy định. Vui lòng tuân thủ quy định khi sử dụng hệ thống.' },
    en: { title: 'Warning from admin', body: 'Your account was reported for a policy violation. Please follow the platform rules.' },
  },
  'report.donationRemoved': {
    vi: { title: 'Đơn đã bị gỡ', body: 'Đơn "{title}" của bạn đã bị gỡ do vi phạm quy định an toàn thực phẩm.' },
    en: { title: 'Donation removed', body: 'Your donation "{title}" was removed for violating food-safety rules.' },
  },
  'report.accountLocked': {
    vi: { title: 'Tài khoản đã bị khoá', body: 'Tài khoản của bạn đã bị tạm khoá do vi phạm quy định. Vui lòng liên hệ quản trị viên.' },
    en: { title: 'Account locked', body: 'Your account has been locked for violating the rules. Please contact the administrator.' },
  },
  // Thông báo kết quả cho NGƯỜI GỬI báo cáo (chỉ nêu kết quả tổng quát).
  'report.reviewer.resolved': {
    vi: { title: 'Báo cáo của bạn đã được xử lý', body: 'Cảm ơn bạn. Quản trị viên đã xem xét và xử lý báo cáo của bạn.' },
    en: { title: 'Your report was handled', body: 'Thank you. An administrator reviewed and acted on your report.' },
  },
  'report.reviewer.dismissed': {
    vi: { title: 'Báo cáo của bạn đã được xem xét', body: 'Quản trị viên đã xem xét nhưng chưa thấy đủ căn cứ vi phạm. Cảm ơn bạn đã phản ánh.' },
    en: { title: 'Your report was reviewed', body: 'An administrator reviewed it but found insufficient grounds. Thank you for reporting.' },
  },
};

const DEFAULT_LANG = 'vi';

function interpolate(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (_, name) => {
    const value = params ? params[name] : undefined;
    return value == null ? '' : String(value);
  });
}

/**
 * Render { title, body } cho 1 key theo ngôn ngữ. Fallback về tiếng Việt nếu
 * thiếu ngôn ngữ, và về chuỗi rỗng nếu key không tồn tại (an toàn, không throw).
 */
function renderNotification(key, lang, params = {}) {
  const entry = DICT[key];
  if (!entry) return { title: '', body: '' };
  const tpl = entry[lang] || entry[DEFAULT_LANG];
  return {
    title: interpolate(tpl.title, params),
    body: interpolate(tpl.body, params),
  };
}

module.exports = { renderNotification, DEFAULT_LANG };
