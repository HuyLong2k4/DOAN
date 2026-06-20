export type ListsKey =
  | 'donorList.title'
  | 'donorList.searchPlaceholder'
  | 'donorList.filter'
  | 'donorList.foodCategories'
  | 'donorList.all'
  | 'donorList.nearMe'
  | 'donorList.noDonors'
  | 'donorList.noNearbyPrefix'
  | 'donorList.addressNotAvailable'
  | 'donorList.kmAway'
  | 'donorList.exp'
  | 'donationDetail.title'
  | 'donationDetail.quantity'
  | 'donationDetail.expires'
  | 'donationDetail.pickupAddress'
  | 'donationDetail.deliveryType'
  | 'donationDetail.connectDonation'
  | 'donationDetail.noAddress'
  | 'donationDetail.noAddressMsg'
  | 'donationDetail.cannotOpenMap'
  | 'donationDetail.cannotDetermineMsg'
  | 'donationDetail.description'
  | 'donationDetail.loadFailed'
  | 'donationDetail.donorInfo'
  | 'donationDetail.callDonor'
  | 'donationDetail.chatDonor'
  | 'donationDetail.cannotOpenChat'
  | 'donationDetail.expiresIn'
  | 'donationDetail.expired'
  | 'donationDetail.aboutToExpire'
  | 'donationDetail.receiverInfo'
  | 'donationDetail.noReceiverYet'
  | 'donationDetail.callReceiver'
  | 'donationDetail.pickupCode'
  | 'addPickup.title'
  | 'addPickup.selectDeliveryType'
  | 'addPickup.estimateAgent'
  | 'addPickup.estimateSelf'
  | 'addPickup.requestApproved'
  | 'addPickup.selectAgentHint'
  | 'addPickup.selfPickupHint'
  | 'addPickup.selfPickupInfo'
  | 'addPickup.currentDonation'
  | 'addPickup.cannotContinue'
  | 'addPickup.autoMatchTitle'
  | 'addPickup.autoMatchHint';

export const listsEn: Record<ListsKey, string> = {
  'donorList.title': 'List of food donors',
  'donorList.searchPlaceholder': 'Search by name',
  'donorList.filter': 'Filter',
  'donorList.foodCategories': 'Food Categories',
  'donorList.all': 'All',
  'donorList.nearMe': 'Near Me',
  'donorList.noDonors': 'No donors found',
  'donorList.noNearbyPrefix': 'No donors within',
  'donorList.addressNotAvailable': 'Address not available',
  'donorList.kmAway': 'km away',
  'donorList.exp': 'Exp:',
  'donationDetail.title': 'Donation Details',
  'donationDetail.quantity': 'Quantity',
  'donationDetail.expires': 'Expires',
  'donationDetail.pickupAddress': 'Pickup Address',
  'donationDetail.deliveryType': 'Delivery Type',
  'donationDetail.connectDonation': 'Connect Donation',
  'donationDetail.noAddress': 'No address',
  'donationDetail.noAddressMsg': 'Address is not available for this donation.',
  'donationDetail.cannotOpenMap': 'Cannot open map',
  'donationDetail.cannotDetermineMsg': 'Cannot determine donation to continue.',
  'donationDetail.description': 'Description',
  'donationDetail.loadFailed': 'Failed to load donation details.',
  'donationDetail.donorInfo': 'Donor info',
  'donationDetail.callDonor': 'Call',
  'donationDetail.chatDonor': 'Chat',
  'donationDetail.cannotOpenChat': 'Cannot open chat',
  'donationDetail.expiresIn': 'Expires in',
  'donationDetail.expired': 'Expired',
  'donationDetail.aboutToExpire': 'Expiring soon',
  'donationDetail.receiverInfo': 'Receiver info',
  'donationDetail.noReceiverYet': 'No receiver has connected yet.',
  'donationDetail.callReceiver': 'Call',
  'donationDetail.pickupCode': 'Pickup code',
  'addPickup.title': 'Add pickup',
  'addPickup.selectDeliveryType': 'Select Type of delivery',
  'addPickup.estimateAgent': 'Estimated Delivery time - 30mins',
  'addPickup.estimateSelf': 'Estimated Pickup prep time - 15mins',
  'addPickup.requestApproved': 'Your request is Approved by donor',
  'addPickup.selectAgentHint': 'Please select an agent to collect your food.',
  'addPickup.selfPickupHint': 'Please coordinate with donor for self pickup.',
  'addPickup.selfPickupInfo': 'You selected self pickup. Donor contact details will be shown in tracking step.',
  'addPickup.currentDonation': 'Current donation:',
  'addPickup.cannotContinue': 'Cannot continue',
  'addPickup.autoMatchTitle': 'Auto-match volunteer',
  'addPickup.autoMatchHint': 'The system will broadcast this delivery to nearby volunteers. Whoever accepts first will pick up your food.',
};

export const listsVi: Record<ListsKey, string> = {
  'donorList.title': 'Danh sách người tặng thực phẩm',
  'donorList.searchPlaceholder': 'Tìm theo tên',
  'donorList.filter': 'Lọc',
  'donorList.foodCategories': 'Danh mục thực phẩm',
  'donorList.all': 'Tất cả',
  'donorList.nearMe': 'Gần tôi',
  'donorList.noDonors': 'Không tìm thấy người tặng',
  'donorList.noNearbyPrefix': 'Không có người tặng nào trong bán kính',
  'donorList.addressNotAvailable': 'Không có địa chỉ',
  'donorList.kmAway': 'km',
  'donorList.exp': 'HH:',
  'donationDetail.title': 'Chi tiết bài ủng hộ',
  'donationDetail.quantity': 'Số lượng',
  'donationDetail.expires': 'Hết hạn',
  'donationDetail.pickupAddress': 'Địa chỉ lấy hàng',
  'donationDetail.deliveryType': 'Phương thức giao',
  'donationDetail.connectDonation': 'Kết nối',
  'donationDetail.noAddress': 'Không có địa chỉ',
  'donationDetail.noAddressMsg': 'Không có địa chỉ cho bài ủng hộ này.',
  'donationDetail.cannotOpenMap': 'Không thể mở bản đồ',
  'donationDetail.cannotDetermineMsg': 'Không thể xác định bài ủng hộ để tiếp tục.',
  'donationDetail.description': 'Mô tả',
  'donationDetail.loadFailed': 'Không tải được chi tiết bài ủng hộ.',
  'donationDetail.donorInfo': 'Thông tin người tặng',
  'donationDetail.callDonor': 'Gọi',
  'donationDetail.chatDonor': 'Nhắn tin',
  'donationDetail.cannotOpenChat': 'Không thể mở chat',
  'donationDetail.expiresIn': 'Hết hạn sau',
  'donationDetail.expired': 'Đã hết hạn',
  'donationDetail.aboutToExpire': 'Sắp hết hạn',
  'donationDetail.receiverInfo': 'Thông tin người nhận',
  'donationDetail.noReceiverYet': 'Chưa có người nhận kết nối.',
  'donationDetail.callReceiver': 'Gọi',
  'donationDetail.pickupCode': 'Mã lấy hàng',
  'addPickup.title': 'Thêm cách nhận',
  'addPickup.selectDeliveryType': 'Chọn phương thức giao',
  'addPickup.estimateAgent': 'Thời gian giao ước tính - 30 phút',
  'addPickup.estimateSelf': 'Thời gian chuẩn bị - 15 phút',
  'addPickup.requestApproved': 'Yêu cầu của bạn đã được người tặng duyệt',
  'addPickup.selectAgentHint': 'Vui lòng chọn tình nguyện viên để lấy thực phẩm.',
  'addPickup.selfPickupHint': 'Vui lòng liên hệ người tặng để tự nhận.',
  'addPickup.selfPickupInfo': 'Bạn đã chọn tự nhận. Thông tin liên hệ của người tặng sẽ hiển thị trong bước theo dõi.',
  'addPickup.currentDonation': 'Bài ủng hộ hiện tại:',
  'addPickup.cannotContinue': 'Không thể tiếp tục',
  'addPickup.autoMatchTitle': 'Tự động ghép volunteer',
  'addPickup.autoMatchHint': 'Hệ thống sẽ gửi đơn này đến các volunteer gần bạn. Volunteer nào nhận đầu tiên sẽ đến lấy hàng.',
};
