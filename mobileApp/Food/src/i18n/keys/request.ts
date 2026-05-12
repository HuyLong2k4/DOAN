export type RequestKey =
  | 'request.listingType'
  | 'request.connectingWith'
  | 'request.typeOfFood'
  | 'request.typeOfFoodSub'
  | 'request.requestTitle'
  | 'request.titlePlaceholder'
  | 'request.cookedFood'
  | 'request.rawVeggies'
  | 'request.frozenFood'
  | 'request.packagedFood'
  | 'request.postedTitle'
  | 'request.postedMsg'
  | 'request.createAnother'
  | 'request.goHome'
  | 'request.errorTitle'
  | 'request.errorQty'
  | 'request.errorAssured'
  | 'request.requestDesc'
  | 'request.descPlaceholder'
  | 'request.mealReq'
  | 'request.foodPref'
  | 'request.foodPrefSub'
  | 'request.foodQty'
  | 'request.foodQtySub'
  | 'request.qtyPlaceholder'
  | 'request.requiredTime'
  | 'request.neededDate'
  | 'request.neededTime'
  | 'request.confirmation'
  | 'request.assurance'
  | 'request.requestNow'
  | 'request.selectFoodType'
  | 'request.popupTitle'
  | 'request.veg'
  | 'request.nonVeg'
  | 'request.both';

export const requestEn: Record<RequestKey, string> = {
  'request.listingType': 'Listing Type: Request',
  'request.connectingWith': 'Connecting with donor:',
  'request.typeOfFood': 'Type of Food',
  'request.typeOfFoodSub': 'Select the main food type you need',
  'request.requestTitle': 'Request Title',
  'request.titlePlaceholder': 'Add your food request title',
  'request.cookedFood': 'Cooked Food',
  'request.rawVeggies': 'Raw veggies & fruits',
  'request.frozenFood': 'Frozen food',
  'request.packagedFood': 'Packaged food',
  'request.postedTitle': 'Request Posted!',
  'request.postedMsg': 'Your food request has been submitted.\nNearby donors can now view it.',
  'request.createAnother': 'Create Another Request',
  'request.goHome': 'Go to Home',
  'request.errorTitle': 'Please add a request title.',
  'request.errorQty': 'Please enter a valid food quantity (in person).',
  'request.errorAssured': 'Please confirm this is a genuine food request.',
  'request.requestDesc': 'Request Description',
  'request.descPlaceholder': 'Eg: Need cooked meals for evening.\nAdd details to help donors understand\nyour requirement quickly.',
  'request.mealReq': 'Meal Requirement',
  'request.foodPref': 'Food Preference',
  'request.foodPrefSub': 'Choose veg, non-veg, or both',
  'request.foodQty': 'Food Quantity',
  'request.foodQtySub': 'Food quantity (in person)',
  'request.qtyPlaceholder': '50 people',
  'request.requiredTime': 'Required Time',
  'request.neededDate': 'Needed Before (Date)',
  'request.neededTime': 'Needed Before (Time)',
  'request.confirmation': 'Confirmation',
  'request.assurance': 'I confirm this request is genuine and reflects my current need.',
  'request.requestNow': 'Request Now',
  'request.selectFoodType': 'Select food type',
  'request.popupTitle': 'Select Type of Food',
  'request.veg': 'Veg',
  'request.nonVeg': 'Non-Veg',
  'request.both': 'Both',
};

export const requestVi: Record<RequestKey, string> = {
  'request.listingType': 'Loại bài đăng: Yêu cầu',
  'request.connectingWith': 'Đang kết nối với người tặng:',
  'request.typeOfFood': 'Loại thực phẩm',
  'request.typeOfFoodSub': 'Chọn loại thực phẩm chính bạn cần',
  'request.requestTitle': 'Tiêu đề yêu cầu',
  'request.titlePlaceholder': 'Thêm tiêu đề yêu cầu thực phẩm',
  'request.cookedFood': 'Thực phẩm nấu chín',
  'request.rawVeggies': 'Rau củ & trái cây tươi',
  'request.frozenFood': 'Thực phẩm đông lạnh',
  'request.packagedFood': 'Thực phẩm đóng gói',
  'request.postedTitle': 'Yêu cầu đã được đăng!',
  'request.postedMsg': 'Yêu cầu thực phẩm của bạn đã được gửi.\nCác người tặng gần đây có thể xem.',
  'request.createAnother': 'Tạo yêu cầu khác',
  'request.goHome': 'Về trang chủ',
  'request.errorTitle': 'Vui lòng thêm tiêu đề yêu cầu.',
  'request.errorQty': 'Vui lòng nhập số lượng thực phẩm hợp lệ.',
  'request.errorAssured': 'Vui lòng xác nhận đây là yêu cầu thực phẩm chính đáng.',
  'request.requestDesc': 'Mô tả yêu cầu',
  'request.descPlaceholder': 'VD: Cần bữa ăn chín vào buổi tối.\nThêm chi tiết giúp người tặng hiểu\nyêu cầu của bạn nhanh hơn.',
  'request.mealReq': 'Yêu cầu bữa ăn',
  'request.foodPref': 'Sở thích ăn',
  'request.foodPrefSub': 'Chọn chay, mặn, hoặc cả hai',
  'request.foodQty': 'Số lượng thực phẩm',
  'request.foodQtySub': 'Số lượng thực phẩm (theo người)',
  'request.qtyPlaceholder': '50 người',
  'request.requiredTime': 'Thời gian cần',
  'request.neededDate': 'Cần trước (Ngày)',
  'request.neededTime': 'Cần trước (Giờ)',
  'request.confirmation': 'Xác nhận',
  'request.assurance': 'Tôi xác nhận yêu cầu này là thực sự và phản ánh nhu cầu hiện tại của tôi.',
  'request.requestNow': 'Gửi yêu cầu',
  'request.selectFoodType': 'Chọn loại thực phẩm',
  'request.popupTitle': 'Chọn loại thực phẩm',
  'request.veg': 'Chay',
  'request.nonVeg': 'Mặn',
  'request.both': 'Cả hai',
};
