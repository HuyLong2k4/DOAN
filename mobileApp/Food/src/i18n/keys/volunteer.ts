export type VolunteerKey =
  | 'volunteer.greeting'
  | 'volunteer.rolePrefix'
  | 'volunteer.role'
  | 'volunteer.stats.delivered'
  | 'volunteer.stats.feedback'
  | 'volunteer.stats.points'
  | 'volunteer.impact.title'
  | 'volunteer.impact.deliveriesLabel'
  | 'volunteer.impact.portionsLabel'
  | 'volunteer.impact.message'
  | 'volunteer.goal'
  | 'volunteer.requestToDeliver'
  | 'volunteer.myDeliveryProgress'
  | 'volunteer.noPendingRequests'
  | 'volunteer.noActiveDeliveries'
  | 'volunteer.noNearbyNgos'
  | 'volunteer.nearMe'
  | 'volunteer.byPopularity'
  | 'volunteer.seeMore'
  | 'volunteer.faqs'
  | 'volunteer.onTheWay'
  | 'volunteer.assigned'
  | 'volunteer.openMap'
  | 'volunteer.chatWithDonor'
  | 'volunteer.openingChat'
  | 'volunteer.preferredForYou'
  | 'volunteer.viewMore'
  | 'volunteer.yes'
  | 'volunteer.no'
  | 'volunteer.distanceUnavailable'
  | 'volunteer.viewDetails'
  | 'volunteer.connect'
  | 'volunteer.release.button'
  | 'volunteer.release.releasing'
  | 'volunteer.release.confirmTitle'
  | 'volunteer.release.confirmMessage'
  | 'volunteer.release.confirmYes'
  | 'volunteer.release.confirmNo'
  | 'volunteer.release.successTitle'
  | 'volunteer.release.successBody'
  | 'volunteer.release.failedTitle'
  | 'volunteer.release.failedBody'
  | 'volunteer.pickupCode.title'
  | 'volunteer.pickupCode.hint'
  | 'volunteer.pickupCode.confirm'
  | 'volunteer.pickupCode.cancel'
  | 'volunteer.pickupCode.invalidLength'
  | 'volunteer.pickupCode.wrongCode'
  | 'volunteer.pickupCode.genericError'
  | 'volunteer.pickUp'
  | 'volunteer.deliverDone'
  | 'volunteer.confirmDeliveryTitle'
  | 'volunteer.confirmDeliveryMsg'
  | 'volunteer.confirm'
  | 'volunteer.deliveredTitle'
  | 'volunteer.cannotOpenMaps'
  | 'volunteer.unableToOpenMaps'
  | 'volunteer.faqQ1'
  | 'volunteer.faqQ2'
  | 'volunteer.pointsLabel'
  | 'volunteer.cannotAccept'
  | 'volunteer.cannotReject'
  | 'volunteer.cannotOpenChat'
  | 'volunteer.cannotOpenChatMsg'
  | 'volunteer.accepted'
  | 'volunteer.acceptedMsg'
  | 'volunteer.somethingWrong'
  | 'volunteer.startPickupTitle'
  | 'volunteer.startPickupMsg'
  | 'volunteer.cannotUpdate'
  | 'volunteer.cancel'
  | 'volunteer.foodQtyPrefix'
  | 'volunteer.receiverPrefix'
  | 'volunteer.pickupPrefix'
  | 'volunteer.pickupAddrUnavailable'
  | 'volunteer.receiverDefault'
  | 'volunteer.cannotCreateConversation'
  | 'volunteer.confirmAcceptPrefix'
  | 'volunteer.confirmAcceptMiddle'
  | 'volunteer.youEarned'
  | 'volunteer.donorEarned';

export const volunteerEn: Record<VolunteerKey, string> = {
  'volunteer.greeting': 'Hi',
  'volunteer.rolePrefix': 'You are a',
  'volunteer.role': 'Volunteer',
  'volunteer.stats.delivered': 'No of orders delivered',
  'volunteer.stats.feedback': 'Feedback received',
  'volunteer.stats.points': 'Points earned',
  'volunteer.impact.title': 'Your impact',
  'volunteer.impact.deliveriesLabel': 'Deliveries',
  'volunteer.impact.portionsLabel': 'Portions delivered',
  'volunteer.impact.message': 'Heroes don\'t always wear capes. Thank you!',
  'volunteer.goal': 'Set your Goal to make a difference',
  'volunteer.requestToDeliver': 'Request to deliver',
  'volunteer.myDeliveryProgress': 'My delivery progress',
  'volunteer.noPendingRequests': 'No pending delivery requests right now',
  'volunteer.noActiveDeliveries': 'No active deliveries right now',
  'volunteer.noNearbyNgos': 'No nearby NGOs found',
  'volunteer.nearMe': 'Near me',
  'volunteer.byPopularity': 'By Popularity',
  'volunteer.seeMore': 'See more',
  'volunteer.faqs': 'FAQs',
  'volunteer.onTheWay': 'On the way',
  'volunteer.assigned': 'Assigned',
  'volunteer.openMap': 'Open Map',
  'volunteer.chatWithDonor': 'Chat with donor',
  'volunteer.openingChat': 'Opening...',
  'volunteer.preferredForYou': 'Preferred for you',
  'volunteer.viewMore': 'View more',
  'volunteer.yes': 'Yes',
  'volunteer.no': 'No',
  'volunteer.distanceUnavailable': 'Distance unavailable',
  'volunteer.viewDetails': 'View Details',
  'volunteer.connect': 'Connect',
  'volunteer.release.button': 'Release delivery',
  'volunteer.release.releasing': 'Releasing...',
  'volunteer.release.confirmTitle': 'Release this delivery?',
  'volunteer.release.confirmMessage': 'The donation will look for another volunteer. You will not see this delivery again.',
  'volunteer.release.confirmYes': 'Yes, release',
  'volunteer.release.confirmNo': 'Keep',
  'volunteer.release.successTitle': 'Released',
  'volunteer.release.successBody': 'The delivery is now available for other volunteers.',
  'volunteer.release.failedTitle': 'Cannot release',
  'volunteer.release.failedBody': 'Please try again.',
  'volunteer.pickupCode.title': 'Enter pickup code',
  'volunteer.pickupCode.hint': 'Ask the donor to read out the 4-digit code shown on their app.',
  'volunteer.pickupCode.confirm': 'Confirm pickup',
  'volunteer.pickupCode.cancel': 'Cancel',
  'volunteer.pickupCode.invalidLength': 'Code must be 4 digits.',
  'volunteer.pickupCode.wrongCode': 'Wrong code. Please ask the donor again.',
  'volunteer.pickupCode.genericError': 'Could not confirm pickup. Please try again.',
  'volunteer.pickUp': 'Picked Up',
  'volunteer.deliverDone': 'Delivered',
  'volunteer.confirmDeliveryTitle': 'Confirm delivery',
  'volunteer.confirmDeliveryMsg': 'Are you sure you delivered successfully?',
  'volunteer.confirm': 'Confirm',
  'volunteer.deliveredTitle': 'Done',
  'volunteer.cannotOpenMaps': 'Cannot open maps',
  'volunteer.unableToOpenMaps': 'Unable to open Google Maps right now.',
  'volunteer.faqQ1': 'Who will pick up the food?',
  'volunteer.faqQ2': 'Can we perform one-time donations?',
  'volunteer.pointsLabel': 'Points:',
  'volunteer.cannotAccept': 'Cannot accept request',
  'volunteer.cannotReject': 'Cannot reject request',
  'volunteer.cannotOpenChat': 'Cannot open chat',
  'volunteer.cannotOpenChatMsg': 'Please try again.',
  'volunteer.accepted': 'Accepted',
  'volunteer.acceptedMsg': 'Delivery request accepted successfully.',
  'volunteer.somethingWrong': 'Something went wrong',
  'volunteer.startPickupTitle': 'Updated',
  'volunteer.startPickupMsg': 'Confirmed pickup, starting delivery.',
  'volunteer.cannotUpdate': 'Cannot update',
  'volunteer.cancel': 'Cancel',
  'volunteer.foodQtyPrefix': 'Food Qty -',
  'volunteer.receiverPrefix': 'Receiver:',
  'volunteer.pickupPrefix': 'Pickup:',
  'volunteer.pickupAddrUnavailable': 'Pickup address not available',
  'volunteer.receiverDefault': 'Receiver',
  'volunteer.cannotCreateConversation': 'Could not create conversation.',
  'volunteer.confirmAcceptPrefix': 'Are you sure you want to deliver food from',
  'volunteer.confirmAcceptMiddle': 'to',
  'volunteer.youEarned': 'You earned +',
  'volunteer.donorEarned': 'Donor earned +',
};

export const volunteerVi: Record<VolunteerKey, string> = {
  'volunteer.greeting': 'Xin chào',
  'volunteer.rolePrefix': 'Bạn là',
  'volunteer.role': 'Tình nguyện viên',
  'volunteer.stats.delivered': 'Số đơn đã giao',
  'volunteer.stats.feedback': 'Phản hồi đã nhận',
  'volunteer.stats.points': 'Điểm đã tích lũy',
  'volunteer.impact.title': 'Đóng góp của bạn',
  'volunteer.impact.deliveriesLabel': 'Lượt giao',
  'volunteer.impact.portionsLabel': 'Suất đã giao',
  'volunteer.impact.message': 'Người hùng thầm lặng. Cảm ơn bạn!',
  'volunteer.goal': 'Đặt mục tiêu để tạo ra sự khác biệt',
  'volunteer.requestToDeliver': 'Yêu cầu giao hàng',
  'volunteer.myDeliveryProgress': 'Tiến độ giao hàng của tôi',
  'volunteer.noPendingRequests': 'Hiện không có yêu cầu giao hàng nào',
  'volunteer.noActiveDeliveries': 'Hiện không có đơn giao hàng nào',
  'volunteer.noNearbyNgos': 'Không tìm thấy tổ chức gần đây',
  'volunteer.nearMe': 'Gần tôi',
  'volunteer.byPopularity': 'Theo độ phổ biến',
  'volunteer.seeMore': 'Xem thêm',
  'volunteer.faqs': 'Câu hỏi thường gặp',
  'volunteer.onTheWay': 'Đang trên đường',
  'volunteer.assigned': 'Đã phân công',
  'volunteer.openMap': 'Mở bản đồ',
  'volunteer.chatWithDonor': 'Chat với người tặng',
  'volunteer.openingChat': 'Đang mở...',
  'volunteer.preferredForYou': 'Phù hợp với bạn',
  'volunteer.viewMore': 'Xem thêm',
  'volunteer.yes': 'Có',
  'volunteer.no': 'Không',
  'volunteer.distanceUnavailable': 'Không có thông tin khoảng cách',
  'volunteer.viewDetails': 'Xem chi tiết',
  'volunteer.connect': 'Kết nối',
  'volunteer.release.button': 'Trả đơn',
  'volunteer.release.releasing': 'Đang trả...',
  'volunteer.release.confirmTitle': 'Trả lại đơn?',
  'volunteer.release.confirmMessage': 'Đơn sẽ tìm volunteer khác. Bạn sẽ không thấy đơn này lại.',
  'volunteer.release.confirmYes': 'Trả đơn',
  'volunteer.release.confirmNo': 'Giữ lại',
  'volunteer.release.successTitle': 'Đã trả đơn',
  'volunteer.release.successBody': 'Đơn đang tìm volunteer khác.',
  'volunteer.release.failedTitle': 'Không trả được',
  'volunteer.release.failedBody': 'Vui lòng thử lại.',
  'volunteer.pickupCode.title': 'Nhập mã pickup',
  'volunteer.pickupCode.hint': 'Yêu cầu donor đọc mã 4 chữ số hiển thị trong app của họ.',
  'volunteer.pickupCode.confirm': 'Xác nhận lấy hàng',
  'volunteer.pickupCode.cancel': 'Huỷ',
  'volunteer.pickupCode.invalidLength': 'Mã phải gồm 4 chữ số.',
  'volunteer.pickupCode.wrongCode': 'Mã không khớp. Vui lòng nhờ donor đọc lại.',
  'volunteer.pickupCode.genericError': 'Không xác nhận được. Vui lòng thử lại.',
  'volunteer.pickUp': 'Đã lấy hàng',
  'volunteer.deliverDone': 'Đã giao xong',
  'volunteer.confirmDeliveryTitle': 'Xác nhận giao hàng',
  'volunteer.confirmDeliveryMsg': 'Bạn chắc chắn đã giao hàng thành công?',
  'volunteer.confirm': 'Xác nhận',
  'volunteer.deliveredTitle': 'Hoàn tất',
  'volunteer.cannotOpenMaps': 'Không thể mở bản đồ',
  'volunteer.unableToOpenMaps': 'Không thể mở Google Maps lúc này.',
  'volunteer.faqQ1': 'Ai sẽ lấy thực phẩm?',
  'volunteer.faqQ2': 'Có thể quyên góp một lần không?',
  'volunteer.pointsLabel': 'Điểm:',
  'volunteer.cannotAccept': 'Không thể tiếp nhận yêu cầu',
  'volunteer.cannotReject': 'Không thể từ chối yêu cầu',
  'volunteer.cannotOpenChat': 'Không thể mở chat',
  'volunteer.cannotOpenChatMsg': 'Vui lòng thử lại.',
  'volunteer.accepted': 'Đã chấp nhận',
  'volunteer.acceptedMsg': 'Đã chấp nhận yêu cầu giao hàng thành công.',
  'volunteer.somethingWrong': 'Đã có lỗi xảy ra',
  'volunteer.startPickupTitle': 'Đã cập nhật',
  'volunteer.startPickupMsg': 'Đã xác nhận lấy hàng và bắt đầu giao.',
  'volunteer.cannotUpdate': 'Không thể cập nhật',
  'volunteer.cancel': 'Hủy',
  'volunteer.foodQtyPrefix': 'SL thực phẩm -',
  'volunteer.receiverPrefix': 'Người nhận:',
  'volunteer.pickupPrefix': 'Lấy hàng tại:',
  'volunteer.pickupAddrUnavailable': 'Không có địa chỉ lấy hàng',
  'volunteer.receiverDefault': 'Người nhận',
  'volunteer.cannotCreateConversation': 'Không tạo được cuộc trò chuyện.',
  'volunteer.confirmAcceptPrefix': 'Bạn có chắc muốn giao thực phẩm từ',
  'volunteer.confirmAcceptMiddle': 'đến',
  'volunteer.youEarned': 'Bạn được +',
  'volunteer.donorEarned': 'Người tặng được +',
};
