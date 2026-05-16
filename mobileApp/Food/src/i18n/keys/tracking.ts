export type TrackingKey =
  | 'tracking.title'
  | 'tracking.loading'
  | 'tracking.notFound'
  | 'tracking.retry'
  | 'tracking.backHome'
  | 'tracking.missingId'
  | 'tracking.cannotLoad'
  | 'tracking.waitingVolunteer'
  | 'tracking.volunteerAssigned'
  | 'tracking.foodOnWay'
  | 'tracking.deliveryCompleted'
  | 'tracking.deliveryStatus'
  | 'tracking.selfPickupCompleted'
  | 'tracking.selfPickupReady'
  | 'tracking.deliveryTimeline'
  | 'tracking.pickupSlotActive'
  | 'tracking.forPrefix'
  | 'tracking.updatingStatus'
  | 'tracking.updatedPrefix'
  | 'tracking.donorCoordsUnavailable'
  | 'tracking.openGoogleMaps'
  | 'tracking.waitingForVolunteer'
  | 'tracking.pickupVolunteer'
  | 'tracking.pickupAtDonor'
  | 'tracking.refPrefix'
  | 'tracking.addressPrefix'
  | 'tracking.tlAssigned'
  | 'tracking.tlPickupSelected'
  | 'tracking.tlPickUp'
  | 'tracking.tlGoPickup'
  | 'tracking.tlComplete'
  | 'tracking.sendMessage'
  | 'tracking.saving'
  | 'tracking.tip'
  | 'tracking.feedback'
  | 'tracking.confirmReceived'
  | 'tracking.awaitingConfirmation'
  | 'tracking.noPhone'
  | 'tracking.noPhoneMsg'
  | 'tracking.cannotCallTitle'
  | 'tracking.cannotCallMsg'
  | 'tracking.completedTitle'
  | 'tracking.donorEarnedPrefix'
  | 'tracking.donorEarnedSuffix'
  | 'tracking.cannotComplete'
  | 'tracking.noDestination'
  | 'tracking.donorLocationNA'
  | 'tracking.yourLocation'
  | 'tracking.currentLocation'
  | 'tracking.donorLocation'
  | 'tracking.disconnectBtn'
  | 'tracking.disconnecting'
  | 'tracking.disconnectConfirmTitle'
  | 'tracking.disconnectConfirmBody'
  | 'tracking.disconnectFromRequestBody'
  | 'tracking.disconnectConfirmYes'
  | 'tracking.disconnectConfirmNo'
  | 'tracking.disconnectSuccessTitle'
  | 'tracking.disconnectFailedTitle'
  | 'tracking.staleWarningTitle'
  | 'tracking.staleWarningBody'
  | 'tracking.reportNoShowBtn'
  | 'tracking.reportingNoShow'
  | 'tracking.reportNoShowConfirmTitle'
  | 'tracking.reportNoShowConfirmBody'
  | 'tracking.reportNoShowConfirmYes'
  | 'tracking.reportNoShowSuccessTitle'
  | 'tracking.reportNoShowFailedTitle';

export const trackingEn: Record<TrackingKey, string> = {
  'tracking.title': 'Live tracking',
  'tracking.loading': 'Loading tracking...',
  'tracking.notFound': 'Tracking not found.',
  'tracking.retry': 'Retry',
  'tracking.backHome': 'Back to Home',
  'tracking.missingId': 'Missing donation id for tracking.',
  'tracking.cannotLoad': 'Cannot load tracking data right now.',
  'tracking.waitingVolunteer': 'waiting for volunteer assignment',
  'tracking.volunteerAssigned': 'volunteer assigned',
  'tracking.foodOnWay': 'your food is on it\'s way',
  'tracking.deliveryCompleted': 'delivery completed',
  'tracking.deliveryStatus': 'delivery status update',
  'tracking.selfPickupCompleted': 'self pickup completed',
  'tracking.selfPickupReady': 'self pickup is ready',
  'tracking.deliveryTimeline': 'Delivery timeline is updating',
  'tracking.pickupSlotActive': 'Pickup slot is active',
  'tracking.forPrefix': 'For:',
  'tracking.updatingStatus': 'Updating status...',
  'tracking.updatedPrefix': 'Updated:',
  'tracking.donorCoordsUnavailable': 'Donor coordinates are not available.',
  'tracking.openGoogleMaps': 'Open in Google Maps',
  'tracking.waitingForVolunteer': 'Waiting for volunteer',
  'tracking.pickupVolunteer': 'Pickup volunteer',
  'tracking.pickupAtDonor': 'Pickup at donor location',
  'tracking.refPrefix': 'Ref:',
  'tracking.addressPrefix': 'Address:',
  'tracking.tlAssigned': 'Assigned',
  'tracking.tlPickupSelected': 'Pickup selected',
  'tracking.tlPickUp': 'Pick Up',
  'tracking.tlGoPickup': 'Go to pickup point',
  'tracking.tlComplete': 'Complete order',
  'tracking.sendMessage': 'Send message',
  'tracking.saving': 'Saving...',
  'tracking.tip': '+ Tip',
  'tracking.feedback': 'Feedback',
  'tracking.confirmReceived': 'Confirm received',
  'tracking.awaitingConfirmation': 'Volunteer reported delivery — please confirm you received the food.',
  'tracking.noPhone': 'No phone number',
  'tracking.noPhoneMsg': 'Contact phone is not available yet.',
  'tracking.cannotCallTitle': 'Cannot open phone',
  'tracking.cannotCallMsg': 'Please call manually.',
  'tracking.completedTitle': 'Completed',
  'tracking.donorEarnedPrefix': '\n\nDonor earned +',
  'tracking.donorEarnedSuffix': ' points.',
  'tracking.cannotComplete': 'Cannot complete',
  'tracking.noDestination': 'No destination',
  'tracking.donorLocationNA': 'Donor location is not available yet.',
  'tracking.yourLocation': 'Your location',
  'tracking.currentLocation': 'Current device location',
  'tracking.donorLocation': 'Donor location',
  'tracking.disconnectBtn': 'Withdraw from order',
  'tracking.disconnecting': 'Withdrawing...',
  'tracking.disconnectConfirmTitle': 'Withdraw from this order?',
  'tracking.disconnectConfirmBody': 'You will be disconnected and the donation will be open for other receivers.',
  'tracking.disconnectFromRequestBody': 'This donation was created for your request. Withdrawing will cancel the donation and reopen your food request.',
  'tracking.disconnectConfirmYes': 'Withdraw',
  'tracking.disconnectConfirmNo': 'Stay',
  'tracking.disconnectSuccessTitle': 'Withdrawn',
  'tracking.disconnectFailedTitle': 'Cannot withdraw',
  'tracking.staleWarningTitle': 'Delivery is taking longer than expected',
  'tracking.staleWarningBody': 'Volunteer picked up over 2 hours ago. If they never arrive, you can report no-show below.',
  'tracking.reportNoShowBtn': 'Report volunteer no-show',
  'tracking.reportingNoShow': 'Reporting...',
  'tracking.reportNoShowConfirmTitle': 'Report volunteer no-show?',
  'tracking.reportNoShowConfirmBody': 'The donation will be cancelled and the volunteer will be notified. Use this only if the volunteer truly did not deliver.',
  'tracking.reportNoShowConfirmYes': 'Report',
  'tracking.reportNoShowSuccessTitle': 'Reported',
  'tracking.reportNoShowFailedTitle': 'Cannot report',
};

export const trackingVi: Record<TrackingKey, string> = {
  'tracking.title': 'Theo dõi trực tiếp',
  'tracking.loading': 'Đang tải...',
  'tracking.notFound': 'Không tìm thấy thông tin theo dõi.',
  'tracking.retry': 'Thử lại',
  'tracking.backHome': 'Về trang chủ',
  'tracking.missingId': 'Thiếu ID bài ủng hộ.',
  'tracking.cannotLoad': 'Không thể tải dữ liệu theo dõi.',
  'tracking.waitingVolunteer': 'đang chờ phân công tình nguyện viên',
  'tracking.volunteerAssigned': 'đã có tình nguyện viên',
  'tracking.foodOnWay': 'thực phẩm đang trên đường',
  'tracking.deliveryCompleted': 'giao hàng hoàn tất',
  'tracking.deliveryStatus': 'cập nhật trạng thái',
  'tracking.selfPickupCompleted': 'đã tự nhận xong',
  'tracking.selfPickupReady': 'sẵn sàng tự nhận',
  'tracking.deliveryTimeline': 'Đang cập nhật tiến trình giao hàng',
  'tracking.pickupSlotActive': 'Khung giờ nhận đang hoạt động',
  'tracking.forPrefix': 'Cho:',
  'tracking.updatingStatus': 'Đang cập nhật...',
  'tracking.updatedPrefix': 'Cập nhật:',
  'tracking.donorCoordsUnavailable': 'Tọa độ người tặng không khả dụng.',
  'tracking.openGoogleMaps': 'Mở trong Google Maps',
  'tracking.waitingForVolunteer': 'Đang chờ tình nguyện viên',
  'tracking.pickupVolunteer': 'Tình nguyện viên lấy hàng',
  'tracking.pickupAtDonor': 'Nhận tại địa điểm người tặng',
  'tracking.refPrefix': 'Mã:',
  'tracking.addressPrefix': 'Địa chỉ:',
  'tracking.tlAssigned': 'Đã phân công',
  'tracking.tlPickupSelected': 'Đã chọn nhận',
  'tracking.tlPickUp': 'Lấy hàng',
  'tracking.tlGoPickup': 'Đến điểm nhận',
  'tracking.tlComplete': 'Hoàn tất đơn',
  'tracking.sendMessage': 'Gửi tin nhắn',
  'tracking.saving': 'Đang lưu...',
  'tracking.tip': '+ Tiền thưởng',
  'tracking.feedback': 'Đánh giá',
  'tracking.confirmReceived': 'Xác nhận đã nhận',
  'tracking.awaitingConfirmation': 'Volunteer báo đã giao — vui lòng xác nhận bạn đã nhận hàng.',
  'tracking.noPhone': 'Không có số điện thoại',
  'tracking.noPhoneMsg': 'Số điện thoại liên hệ chưa có.',
  'tracking.cannotCallTitle': 'Không thể gọi',
  'tracking.cannotCallMsg': 'Vui lòng gọi thủ công.',
  'tracking.completedTitle': 'Hoàn tất',
  'tracking.donorEarnedPrefix': '\n\nNgười tặng được +',
  'tracking.donorEarnedSuffix': ' điểm.',
  'tracking.cannotComplete': 'Không thể hoàn tất',
  'tracking.noDestination': 'Không có đích đến',
  'tracking.donorLocationNA': 'Chưa có vị trí người tặng.',
  'tracking.yourLocation': 'Vị trí của bạn',
  'tracking.currentLocation': 'Vị trí thiết bị hiện tại',
  'tracking.donorLocation': 'Vị trí người tặng',
  'tracking.disconnectBtn': 'Rút khỏi đơn',
  'tracking.disconnecting': 'Đang rút...',
  'tracking.disconnectConfirmTitle': 'Rút khỏi đơn này?',
  'tracking.disconnectConfirmBody': 'Bạn sẽ ngắt kết nối và đơn sẽ mở lại cho receiver khác kết nối.',
  'tracking.disconnectFromRequestBody': 'Đơn này được tạo từ food request của bạn. Rút khỏi sẽ huỷ đơn và mở lại food request.',
  'tracking.disconnectConfirmYes': 'Rút khỏi',
  'tracking.disconnectConfirmNo': 'Ở lại',
  'tracking.disconnectSuccessTitle': 'Đã rút',
  'tracking.disconnectFailedTitle': 'Không rút được',
  'tracking.staleWarningTitle': 'Đơn giao đang chậm hơn dự kiến',
  'tracking.staleWarningBody': 'Volunteer đã lấy hàng hơn 2 giờ. Nếu volunteer không đến, bạn có thể báo no-show dưới đây.',
  'tracking.reportNoShowBtn': 'Báo volunteer không đến',
  'tracking.reportingNoShow': 'Đang báo cáo...',
  'tracking.reportNoShowConfirmTitle': 'Báo volunteer không đến?',
  'tracking.reportNoShowConfirmBody': 'Đơn sẽ bị huỷ và volunteer sẽ được thông báo. Chỉ dùng khi volunteer thực sự không giao.',
  'tracking.reportNoShowConfirmYes': 'Báo cáo',
  'tracking.reportNoShowSuccessTitle': 'Đã báo cáo',
  'tracking.reportNoShowFailedTitle': 'Không báo được',
};
