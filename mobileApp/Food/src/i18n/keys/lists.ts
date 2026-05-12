export type ListsKey =
  | 'donorList.title'
  | 'donorList.searchPlaceholder'
  | 'donorList.filter'
  | 'donorList.foodCategories'
  | 'donorList.all'
  | 'donorList.veg'
  | 'donorList.nonVeg'
  | 'donorList.nearMe'
  | 'donorList.noDonors'
  | 'donorList.addressNotAvailable'
  | 'donorList.kmAway'
  | 'donorList.exp'
  | 'ngoList.title'
  | 'ngoList.searchPlaceholder'
  | 'ngoList.nearMe'
  | 'ngoList.byPopularity'
  | 'ngoList.noNgos'
  | 'ngoList.addressNotAvailable'
  | 'ngoList.unknownDistance'
  | 'ngoList.viewDetails'
  | 'ngoList.donate'
  | 'donationDetail.title'
  | 'donationDetail.from'
  | 'donationDetail.quantity'
  | 'donationDetail.expires'
  | 'donationDetail.pickupAddress'
  | 'donationDetail.status'
  | 'donationDetail.deliveryType'
  | 'donationDetail.connectDonation'
  | 'donationDetail.noAddress'
  | 'donationDetail.noAddressMsg'
  | 'donationDetail.cannotOpenMap'
  | 'donationDetail.cannotDetermineMsg'
  | 'addPickup.title'
  | 'addPickup.selectDeliveryType'
  | 'addPickup.estimateAgent'
  | 'addPickup.estimateSelf'
  | 'addPickup.requestApproved'
  | 'addPickup.selectAgentHint'
  | 'addPickup.selfPickupHint'
  | 'addPickup.chooseAgent'
  | 'addPickup.noAgents'
  | 'addPickup.selfPickupInfo'
  | 'addPickup.currentDonation'
  | 'addPickup.distanceNA'
  | 'addPickup.errorLoadVolunteer'
  | 'addPickup.selectAgentTitle'
  | 'addPickup.selectAgentMsg'
  | 'addPickup.cannotContinue'
  | 'addPickup.completed'
  | 'addPickup.pickup'
  | 'addPickup.pickups';

export const listsEn: Record<ListsKey, string> = {
  'donorList.title': 'List of food donors',
  'donorList.searchPlaceholder': 'Search by name',
  'donorList.filter': 'Filter',
  'donorList.foodCategories': 'Food Categories',
  'donorList.all': 'All',
  'donorList.veg': 'Veg',
  'donorList.nonVeg': 'Non-Veg',
  'donorList.nearMe': 'Near Me',
  'donorList.noDonors': 'No donors found',
  'donorList.addressNotAvailable': 'Address not available',
  'donorList.kmAway': 'km away',
  'donorList.exp': 'Exp:',
  'ngoList.title': 'List of NGOs',
  'ngoList.searchPlaceholder': 'Search NGO by name',
  'ngoList.nearMe': 'Near me',
  'ngoList.byPopularity': 'By Popularity',
  'ngoList.noNgos': 'No NGOs found',
  'ngoList.addressNotAvailable': 'Address not available',
  'ngoList.unknownDistance': 'Unknown distance',
  'ngoList.viewDetails': 'View Details',
  'ngoList.donate': 'Donate',
  'donationDetail.title': 'Donation Details',
  'donationDetail.from': 'From:',
  'donationDetail.quantity': 'Quantity',
  'donationDetail.expires': 'Expires',
  'donationDetail.pickupAddress': 'Pickup Address',
  'donationDetail.status': 'Status',
  'donationDetail.deliveryType': 'Delivery Type',
  'donationDetail.connectDonation': 'Connect Donation',
  'donationDetail.noAddress': 'No address',
  'donationDetail.noAddressMsg': 'Address is not available for this donation.',
  'donationDetail.cannotOpenMap': 'Cannot open map',
  'donationDetail.cannotDetermineMsg': 'Cannot determine donation to continue.',
  'addPickup.title': 'Add pickup',
  'addPickup.selectDeliveryType': 'Select Type of delivery',
  'addPickup.estimateAgent': 'Estimated Delivery time - 30mins',
  'addPickup.estimateSelf': 'Estimated Pickup prep time - 15mins',
  'addPickup.requestApproved': 'Your request is Approved by donor',
  'addPickup.selectAgentHint': 'Please select an agent to collect your food.',
  'addPickup.selfPickupHint': 'Please coordinate with donor for self pickup.',
  'addPickup.chooseAgent': 'Choose agent to pick Up',
  'addPickup.noAgents': 'No volunteers available right now. Please try again later.',
  'addPickup.selfPickupInfo': 'You selected self pickup. Donor contact details will be shown in tracking step.',
  'addPickup.currentDonation': 'Current donation:',
  'addPickup.distanceNA': 'Distance N/A',
  'addPickup.errorLoadVolunteer': 'Cannot load volunteers',
  'addPickup.selectAgentTitle': 'Select agent',
  'addPickup.selectAgentMsg': 'Please select an agent to continue.',
  'addPickup.cannotContinue': 'Cannot continue',
  'addPickup.completed': 'Completed',
  'addPickup.pickup': 'pickup',
  'addPickup.pickups': 'pickups',
};

export const listsVi: Record<ListsKey, string> = {
  'donorList.title': 'Danh sách người tặng thực phẩm',
  'donorList.searchPlaceholder': 'Tìm theo tên',
  'donorList.filter': 'Lọc',
  'donorList.foodCategories': 'Danh mục thực phẩm',
  'donorList.all': 'Tất cả',
  'donorList.veg': 'Đồ chay',
  'donorList.nonVeg': 'Đồ mặn',
  'donorList.nearMe': 'Gần tôi',
  'donorList.noDonors': 'Không tìm thấy người tặng',
  'donorList.addressNotAvailable': 'Không có địa chỉ',
  'donorList.kmAway': 'km',
  'donorList.exp': 'HH:',
  'ngoList.title': 'Danh sách tổ chức NGO',
  'ngoList.searchPlaceholder': 'Tìm NGO theo tên',
  'ngoList.nearMe': 'Gần tôi',
  'ngoList.byPopularity': 'Theo độ phổ biến',
  'ngoList.noNgos': 'Không tìm thấy NGO',
  'ngoList.addressNotAvailable': 'Không có địa chỉ',
  'ngoList.unknownDistance': 'Không rõ khoảng cách',
  'ngoList.viewDetails': 'Xem chi tiết',
  'ngoList.donate': 'Quyên góp',
  'donationDetail.title': 'Chi tiết bài ủng hộ',
  'donationDetail.from': 'Từ:',
  'donationDetail.quantity': 'Số lượng',
  'donationDetail.expires': 'Hết hạn',
  'donationDetail.pickupAddress': 'Địa chỉ lấy hàng',
  'donationDetail.status': 'Trạng thái',
  'donationDetail.deliveryType': 'Phương thức giao',
  'donationDetail.connectDonation': 'Kết nối',
  'donationDetail.noAddress': 'Không có địa chỉ',
  'donationDetail.noAddressMsg': 'Không có địa chỉ cho bài ủng hộ này.',
  'donationDetail.cannotOpenMap': 'Không thể mở bản đồ',
  'donationDetail.cannotDetermineMsg': 'Không thể xác định bài ủng hộ để tiếp tục.',
  'addPickup.title': 'Thêm cách nhận',
  'addPickup.selectDeliveryType': 'Chọn phương thức giao',
  'addPickup.estimateAgent': 'Thời gian giao ước tính - 30 phút',
  'addPickup.estimateSelf': 'Thời gian chuẩn bị - 15 phút',
  'addPickup.requestApproved': 'Yêu cầu của bạn đã được người tặng duyệt',
  'addPickup.selectAgentHint': 'Vui lòng chọn tình nguyện viên để lấy thực phẩm.',
  'addPickup.selfPickupHint': 'Vui lòng liên hệ người tặng để tự nhận.',
  'addPickup.chooseAgent': 'Chọn tình nguyện viên',
  'addPickup.noAgents': 'Hiện chưa có tình nguyện viên. Vui lòng thử lại sau.',
  'addPickup.selfPickupInfo': 'Bạn đã chọn tự nhận. Thông tin liên hệ của người tặng sẽ hiển thị trong bước theo dõi.',
  'addPickup.currentDonation': 'Bài ủng hộ hiện tại:',
  'addPickup.distanceNA': 'N/A',
  'addPickup.errorLoadVolunteer': 'Không tải được tình nguyện viên',
  'addPickup.selectAgentTitle': 'Chọn tình nguyện viên',
  'addPickup.selectAgentMsg': 'Vui lòng chọn tình nguyện viên để tiếp tục.',
  'addPickup.cannotContinue': 'Không thể tiếp tục',
  'addPickup.completed': 'Đã hoàn thành',
  'addPickup.pickup': 'chuyến',
  'addPickup.pickups': 'chuyến',
};
