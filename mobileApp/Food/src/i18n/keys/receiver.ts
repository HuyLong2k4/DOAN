export type ReceiverKey =
  | 'receiver.greeting'
  | 'receiver.rolePrefix'
  | 'receiver.role'
  | 'receiver.ordersReceived'
  | 'receiver.impact.ngosLabel'
  | 'receiver.myPost'
  | 'receiver.donorsPosts'
  | 'receiver.nothingTillNow'
  | 'receiver.requireFood'
  | 'receiver.createFoodRequest'
  | 'receiver.noDonorPosts'
  | 'receiver.foodDonorsNearYou'
  | 'receiver.seeMore'
  | 'receiver.unknownDonor'
  | 'receiver.connectSuccessTitle'
  | 'receiver.connectSuccessDefault'
  | 'receiver.choosePickup'
  | 'receiver.connectFailedTitle'
  | 'receiver.connectFailedDefault'
  | 'receiver.noNearbyDonors'
  | 'receiver.faqs'
  | 'receiver.faq.pickup'
  | 'receiver.faq.pickupAnswer'
  | 'receiver.faq.multiple'
  | 'receiver.faq.multipleAnswer'
  | 'receiver.unknownDistance'
  | 'receiver.viewDetails'
  | 'receiver.waitingAgent'
  | 'receiver.selfPickupReady'
  | 'receiver.connecting'
  | 'receiver.connect'
  | 'receiver.claimQuantityTitle'
  | 'receiver.claimAvailable'
  | 'receiver.claimQuantityLabel'
  | 'receiver.claimAll'
  | 'receiver.claimConfirm'
  | 'receiver.claimInvalid'
  | 'receiver.portion'
  | 'receiver.foodTypeNotSpecified'
  | 'receiver.pending'
  | 'receiver.accepted'
  | 'receiver.fulfilled'
  | 'receiver.cancelled'
  | 'receiver.requestExpired'
  | 'receiver.neededBefore'
  | 'receiver.notSpecified'
  | 'receiver.foodQuantity'
  | 'receiver.openTracking'
  | 'receiver.choosePickupMethod'
  | 'receiver.deleteRequestTitle'
  | 'receiver.deleteRequestBody'
  | 'receiver.deletePermanently'
  | 'receiver.deleteFailed'
  | 'receiver.tryAgain'
  | 'receiver.missingDonationTitle'
  | 'receiver.missingDonationBody';

export const receiverEn: Record<ReceiverKey, string> = {
  'receiver.greeting': 'Hi',
  'receiver.rolePrefix': 'You are a',
  'receiver.role': 'Receiver',
  'receiver.ordersReceived': 'No of orders received',
  'receiver.impact.ngosLabel': 'Kind donors',
  'receiver.myPost': 'My Post',
  'receiver.donorsPosts': 'Donor\'s Posts',
  'receiver.nothingTillNow': 'Nothing till now',
  'receiver.requireFood': 'Do you require food?',
  'receiver.createFoodRequest': 'Create Food Request',
  'receiver.noDonorPosts': 'No donor posts right now',
  'receiver.foodDonorsNearYou': 'Food donors Near You',
  'receiver.seeMore': 'See More',
  'receiver.unknownDonor': 'Unknown donor',
  'receiver.connectSuccessTitle': 'Connected',
  'receiver.connectSuccessDefault': 'Connected successfully. Please choose pickup method.',
  'receiver.choosePickup': 'Choose Pickup',
  'receiver.connectFailedTitle': 'Connect failed',
  'receiver.connectFailedDefault': 'Please try again.',
  'receiver.noNearbyDonors': 'No nearby donors yet',
  'receiver.faqs': 'FAQs',
  'receiver.faq.pickup': 'Who will pick up the food?',
  'receiver.faq.pickupAnswer':
    'It depends on the delivery method. If the donor sends it via an agent, a volunteer will pick it up and deliver it to you. If you choose self-pickup, you go to the address shown in the donation to collect it yourself.',
  'receiver.faq.multiple': 'Can we perform multiple food requests at once?',
  'receiver.faq.multipleAnswer':
    'Yes. You can create several food requests at the same time, and each one is tracked independently in the "My Posts" tab until it is fulfilled or cancelled.',
  'receiver.unknownDistance': 'Unknown distance',
  'receiver.viewDetails': 'View Details',
  'receiver.waitingAgent': 'Waiting Agent',
  'receiver.selfPickupReady': 'Self Pickup Ready',
  'receiver.connecting': 'Connecting...',
  'receiver.connect': 'Connect',
  'receiver.claimQuantityTitle': 'Choose quantity',
  'receiver.claimAvailable': 'Available',
  'receiver.claimQuantityLabel': 'Quantity to receive',
  'receiver.claimAll': 'All',
  'receiver.claimConfirm': 'Confirm',
  'receiver.claimInvalid': 'Enter a valid quantity.',
  'receiver.portion': 'portion',
  'receiver.foodTypeNotSpecified': 'Food type not specified',
  'receiver.pending': 'Your request is pending',
  'receiver.accepted': 'Request accepted',
  'receiver.fulfilled': 'Request fulfilled',
  'receiver.cancelled': 'Request cancelled',
  'receiver.requestExpired': 'Past deadline — donors no longer see this',
  'receiver.neededBefore': 'Needed before',
  'receiver.notSpecified': 'Not specified',
  'receiver.foodQuantity': 'Food Quantity',
  'receiver.openTracking': 'Open tracking',
  'receiver.choosePickupMethod': 'Choose pickup method',
  'receiver.deleteRequestTitle': 'Delete request?',
  'receiver.deleteRequestBody': 'This action will permanently delete this request.',
  'receiver.deletePermanently': 'Delete permanently',
  'receiver.deleteFailed': 'Delete failed',
  'receiver.tryAgain': 'Please try again.',
  'receiver.missingDonationTitle': 'Missing donation',
  'receiver.missingDonationBody': 'Donor has accepted but donation link is not ready yet. Please refresh.',
};

export const receiverVi: Record<ReceiverKey, string> = {
  'receiver.greeting': 'Xin chào',
  'receiver.rolePrefix': 'Bạn là',
  'receiver.role': 'Người nhận',
  'receiver.ordersReceived': 'Số đơn đã nhận',
  'receiver.impact.ngosLabel': 'Người tặng tốt bụng',
  'receiver.myPost': 'Bài đăng của tôi',
  'receiver.donorsPosts': 'Bài đăng từ người tặng',
  'receiver.nothingTillNow': 'Chưa có dữ liệu',
  'receiver.requireFood': 'Bạn đang cần thực phẩm?',
  'receiver.createFoodRequest': 'Tạo yêu cầu thực phẩm',
  'receiver.noDonorPosts': 'Hiện chưa có bài đăng nào',
  'receiver.foodDonorsNearYou': 'Người tặng gần bạn',
  'receiver.seeMore': 'Xem thêm',
  'receiver.unknownDonor': 'Người tặng không rõ',
  'receiver.connectSuccessTitle': 'Đã kết nối',
  'receiver.connectSuccessDefault': 'Kết nối thành công. Hãy chọn phương thức nhận.',
  'receiver.choosePickup': 'Chọn cách nhận',
  'receiver.connectFailedTitle': 'Kết nối thất bại',
  'receiver.connectFailedDefault': 'Vui lòng thử lại.',
  'receiver.noNearbyDonors': 'Chưa có người tặng nào gần bạn',
  'receiver.faqs': 'Câu hỏi thường gặp',
  'receiver.faq.pickup': 'Ai sẽ lấy thực phẩm?',
  'receiver.faq.pickupAnswer':
    'Tùy theo hình thức nhận. Nếu người quyên góp gửi qua tình nguyện viên, tình nguyện viên sẽ lấy và giao đến cho bạn. Nếu bạn chọn tự đến lấy, bạn đến địa chỉ hiển thị trong bài đăng để nhận trực tiếp.',
  'receiver.faq.multiple': 'Có thể tạo nhiều yêu cầu cùng lúc không?',
  'receiver.faq.multipleAnswer':
    'Được. Bạn có thể tạo nhiều yêu cầu thực phẩm cùng lúc, mỗi yêu cầu được theo dõi riêng trong tab "Bài đăng của tôi" cho đến khi hoàn tất hoặc bị hủy.',
  'receiver.unknownDistance': 'Không rõ khoảng cách',
  'receiver.viewDetails': 'Xem chi tiết',
  'receiver.waitingAgent': 'Đang chờ tình nguyện viên',
  'receiver.selfPickupReady': 'Sẵn sàng tự đến nhận',
  'receiver.connecting': 'Đang kết nối...',
  'receiver.connect': 'Kết nối',
  'receiver.claimQuantityTitle': 'Chọn số suất',
  'receiver.claimAvailable': 'Còn lại',
  'receiver.claimQuantityLabel': 'Số suất muốn nhận',
  'receiver.claimAll': 'Tất cả',
  'receiver.claimConfirm': 'Xác nhận',
  'receiver.claimInvalid': 'Nhập số lượng hợp lệ.',
  'receiver.portion': 'suất',
  'receiver.foodTypeNotSpecified': 'Chưa xác định loại thực phẩm',
  'receiver.pending': 'Yêu cầu đang chờ xử lý',
  'receiver.accepted': 'Yêu cầu đã được chấp nhận',
  'receiver.fulfilled': 'Yêu cầu đã hoàn tất',
  'receiver.cancelled': 'Yêu cầu đã hủy',
  'receiver.requestExpired': 'Đã quá hạn — donor không còn thấy',
  'receiver.neededBefore': 'Cần trước',
  'receiver.notSpecified': 'Chưa xác định',
  'receiver.foodQuantity': 'Số lượng thực phẩm',
  'receiver.openTracking': 'Mở theo dõi',
  'receiver.choosePickupMethod': 'Chọn phương thức nhận',
  'receiver.deleteRequestTitle': 'Xóa yêu cầu?',
  'receiver.deleteRequestBody': 'Hành động này sẽ xóa vĩnh viễn yêu cầu này.',
  'receiver.deletePermanently': 'Xóa vĩnh viễn',
  'receiver.deleteFailed': 'Xóa thất bại',
  'receiver.tryAgain': 'Vui lòng thử lại.',
  'receiver.missingDonationTitle': 'Thiếu liên kết bài tặng',
  'receiver.missingDonationBody': 'Người tặng đã chấp nhận nhưng liên kết chưa sẵn sàng. Vui lòng tải lại trang.',
};
