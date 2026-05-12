export type DonorKey =
  | 'donor.greeting'
  | 'donor.greetingFallback'
  | 'donor.rolePrefix'
  | 'donor.role'
  | 'donor.level.newMember'
  | 'donor.level.bronzeDonor'
  | 'donor.level.silverDonor'
  | 'donor.level.goldDonor'
  | 'donor.level.superDonor'
  | 'donor.level.legend'
  | 'donor.stats.donations'
  | 'donor.stats.feedback'
  | 'donor.stats.points'
  | 'donor.impact.title'
  | 'donor.impact.donationsLabel'
  | 'donor.impact.portionsLabel'
  | 'donor.impact.message'
  | 'donor.tab.myPost'
  | 'donor.tab.requests'
  | 'donor.empty.promptDonate'
  | 'donor.empty.createMoreDonation'
  | 'donor.empty.nothingYet'
  | 'donor.empty.createDonationPost'
  | 'donor.receiverRequests.title'
  | 'donor.request.label'
  | 'donor.qty.label'
  | 'donor.preference.label'
  | 'donor.neededBefore.label'
  | 'donor.accepting'
  | 'donor.accept'
  | 'donor.receiverFallback'
  | 'donor.donationLabel'
  | 'donor.phoneLabel'
  | 'donor.rejecting'
  | 'donor.reject'
  | 'donor.approving'
  | 'donor.approve'
  | 'donor.approvedRequestsTitle'
  | 'donor.delivery.viaAgent'
  | 'donor.delivery.selfPickup'
  | 'donor.delivery.awaitingChoice'
  | 'donor.openingChat'
  | 'donor.chatWithVolunteer'
  | 'donor.noReceiverRequests'
  | 'donor.history.title'
  | 'donor.history.searchPlaceholder'
  | 'donor.history.loading'
  | 'donor.history.tryAgain'
  | 'donor.history.noMatch'
  | 'donor.history.noYet'
  | 'donor.history.loadFailed'
  | 'donor.viewAll'
  | 'donor.noDonationsYet'
  | 'donor.ngo.title'
  | 'donor.seeMore'
  | 'donor.noNgosYet'
  | 'donor.faq.title'
  | 'donor.faq.pickup'
  | 'donor.faq.oneTime'
  | 'donor.notSpecified'
  | 'donor.portion'
  | 'donor.foodPreference.veg'
  | 'donor.foodPreference.nonVeg'
  | 'donor.foodPreference.vegAndNonVeg'
  | 'donor.alert.approveTitle'
  | 'donor.alert.approveBody'
  | 'donor.alert.approveFailedTitle'
  | 'donor.alert.approveFailedBody'
  | 'donor.alert.rejectTitle'
  | 'donor.alert.rejectBody'
  | 'donor.alert.rejectFailedTitle'
  | 'donor.alert.rejectFailedBody'
  | 'donor.alert.acceptSuccessTitle'
  | 'donor.alert.acceptSuccessBody'
  | 'donor.alert.acceptFailedTitle'
  | 'donor.alert.acceptFailedBody'
  | 'donor.alert.chatCreateFailed'
  | 'donor.chatTitleFallback'
  | 'donor.alert.chatOpenFailedTitle'
  | 'donor.alert.chatOpenFailedBody'
  | 'donor.cancel.button'
  | 'donor.cancel.cancelling'
  | 'donor.cancel.confirmTitle'
  | 'donor.cancel.confirmMessage'
  | 'donor.cancel.confirmYes'
  | 'donor.cancel.confirmNo'
  | 'donor.cancel.successTitle'
  | 'donor.cancel.successBody'
  | 'donor.cancel.failedTitle'
  | 'donor.cancel.failedBody'
  | 'donor.pickupCode.title'
  | 'donor.pickupCode.hint'
  | 'donor.donate.header'
  | 'donor.donate.addTitle'
  | 'donor.donate.addTitlePlaceholder'
  | 'donor.donate.description'
  | 'donor.donate.descPlaceholder'
  | 'donor.donate.typeOfFood'
  | 'donor.donate.cookedFood'
  | 'donor.donate.fruitsVegetables'
  | 'donor.donate.packagedFood'
  | 'donor.donate.frozenFood'
  | 'donor.donate.foodQuantity'
  | 'donor.donate.selectYourMeal'
  | 'donor.donate.photos'
  | 'donor.donate.addMore'
  | 'donor.donate.expirationDate'
  | 'donor.donate.expirationTime'
  | 'donor.donate.dateFormat'
  | 'donor.donate.timeFormat'
  | 'donor.donate.qualityAssurance'
  | 'donor.donate.assuranceText'
  | 'donor.donate.submit'
  | 'donor.donate.donateAgain'
  | 'donor.donate.viewMyPosts'
  | 'donor.donate.donationPosted'
  | 'donor.donate.donationPostedMessage'
  | 'donor.donate.titleRequired'
  | 'donor.donate.dateRequired'
  | 'donor.donate.assuranceRequired'
  | 'donor.donate.permissionRequired'
  | 'donor.donate.createFailed';

export const donorEn: Record<DonorKey, string> = {
  'donor.greeting': 'Hi',
  'donor.greetingFallback': 'there',
  'donor.rolePrefix': 'You are a',
  'donor.role': 'Donor',
  'donor.level.newMember': 'New Member',
  'donor.level.bronzeDonor': 'Bronze Donor',
  'donor.level.silverDonor': 'Silver Donor',
  'donor.level.goldDonor': 'Gold Donor',
  'donor.level.superDonor': 'Super Donor',
  'donor.level.legend': 'Legend',
  'donor.stats.donations': 'No of Donations',
  'donor.stats.feedback': 'Feedback received',
  'donor.stats.points': 'Points earned',
  'donor.impact.title': 'Your impact',
  'donor.impact.donationsLabel': 'Donations',
  'donor.impact.portionsLabel': 'Portions shared',
  'donor.impact.message': 'Thank you for making a difference!',
  'donor.tab.myPost': 'My Post',
  'donor.tab.requests': 'Receiver Requests',
  'donor.empty.promptDonate': 'Do you have some food to donate?',
  'donor.empty.createMoreDonation': '+ Create More Donation',
  'donor.empty.nothingYet': 'Nothing till now',
  'donor.empty.createDonationPost': '+ Create Donation Post',
  'donor.receiverRequests.title': 'Receiver Food Requests',
  'donor.request.label': 'Request',
  'donor.qty.label': 'Qty',
  'donor.preference.label': 'Preference',
  'donor.neededBefore.label': 'Needed before',
  'donor.accepting': 'Accepting...',
  'donor.accept': 'Accept',
  'donor.receiverFallback': 'Receiver',
  'donor.donationLabel': 'Donation',
  'donor.phoneLabel': 'Phone',
  'donor.rejecting': 'Rejecting...',
  'donor.reject': 'Reject',
  'donor.approving': 'Approving...',
  'donor.approve': 'Approve',
  'donor.approvedRequestsTitle': 'Approved Requests',
  'donor.delivery.viaAgent': 'Via Agent',
  'donor.delivery.selfPickup': 'Self Pickup',
  'donor.delivery.awaitingChoice': 'Awaiting Choice',
  'donor.openingChat': 'Opening chat...',
  'donor.chatWithVolunteer': 'Chat with volunteer',
  'donor.noReceiverRequests': 'No receiver requests yet',
  'donor.history.title': 'Donation History',
  'donor.history.searchPlaceholder': 'Search by title, status, or ID',
  'donor.history.loading': 'Loading donation history...',
  'donor.history.tryAgain': 'Try again',
  'donor.history.noMatch': 'No donations match your search.',
  'donor.history.noYet': 'You have not posted any donations yet.',
  'donor.history.loadFailed': 'Could not load your donation history.',
  'donor.viewAll': 'View all',
  'donor.noDonationsYet': 'No donations yet',
  'donor.ngo.title': 'NGOs Near You',
  'donor.seeMore': 'See more',
  'donor.noNgosYet': 'No NGOs available yet',
  'donor.faq.title': 'FAQs',
  'donor.faq.pickup': 'Who will pick up the food?',
  'donor.faq.oneTime': 'Can we perform one-time donations?',
  'donor.notSpecified': 'Not specified',
  'donor.portion': 'portion',
  'donor.foodPreference.veg': 'Veg',
  'donor.foodPreference.nonVeg': 'Non-Veg',
  'donor.foodPreference.vegAndNonVeg': 'Veg & Non-Veg',
  'donor.alert.approveTitle': 'Approved',
  'donor.alert.approveBody': 'Receiver request approved.',
  'donor.alert.approveFailedTitle': 'Approve failed',
  'donor.alert.approveFailedBody': 'Please try again.',
  'donor.alert.rejectTitle': 'Rejected',
  'donor.alert.rejectBody': 'Receiver request rejected.',
  'donor.alert.rejectFailedTitle': 'Reject failed',
  'donor.alert.rejectFailedBody': 'Please try again.',
  'donor.alert.acceptSuccessTitle': 'Accepted',
  'donor.alert.acceptSuccessBody': 'Receiver request accepted.',
  'donor.alert.acceptFailedTitle': 'Cannot accept',
  'donor.alert.acceptFailedBody': 'Please try again.',
  'donor.alert.chatCreateFailed': 'Could not create conversation.',
  'donor.chatTitleFallback': 'Volunteer chat',
  'donor.alert.chatOpenFailedTitle': 'Cannot open chat',
  'donor.alert.chatOpenFailedBody': 'Please try again.',
  'donor.cancel.button': 'Cancel donation',
  'donor.cancel.cancelling': 'Cancelling...',
  'donor.cancel.confirmTitle': 'Cancel donation?',
  'donor.cancel.confirmMessage': 'This donation will be marked as cancelled. Receivers and volunteers will be notified.',
  'donor.cancel.confirmYes': 'Yes, cancel',
  'donor.cancel.confirmNo': 'Keep',
  'donor.cancel.successTitle': 'Cancelled',
  'donor.cancel.successBody': 'Donation has been cancelled.',
  'donor.cancel.failedTitle': 'Cannot cancel',
  'donor.cancel.failedBody': 'Please try again.',
  'donor.pickupCode.title': 'Pickup code',
  'donor.pickupCode.hint': 'Read this code aloud to the volunteer when they arrive.',
  'donor.donate.header': 'Listing Type: Donation',
  'donor.donate.addTitle': 'Add Title',
  'donor.donate.addTitlePlaceholder': 'Add food title',
  'donor.donate.description': 'Description:',
  'donor.donate.descPlaceholder': 'Eg: tomatoes from the garden.\nGive as many details as possible to increase\nyour chances of giving your object away\nquickly.',
  'donor.donate.typeOfFood': 'Type of Food',
  'donor.donate.cookedFood': 'Cooked Food',
  'donor.donate.fruitsVegetables': 'Fruits & Vegetables',
  'donor.donate.packagedFood': 'Packaged Food',
  'donor.donate.frozenFood': 'Frozen Food',
  'donor.donate.foodQuantity': 'Food Quantity',
  'donor.donate.selectYourMeal': 'Select your meal',
  'donor.donate.photos': 'Photos:',
  'donor.donate.addMore': '+Add more',
  'donor.donate.expirationDate': 'Expiration Date',
  'donor.donate.expirationTime': 'Expiration Time',
  'donor.donate.dateFormat': 'DD MMM YYYY',
  'donor.donate.timeFormat': 'HH:MM AM/PM',
  'donor.donate.qualityAssurance': 'Quality Assurance',
  'donor.donate.assuranceText': 'I assure that the food quality and hygiene has maintained',
  'donor.donate.submit': 'Submit',
  'donor.donate.donateAgain': 'Donate Again',
  'donor.donate.viewMyPosts': 'View My Posts',
  'donor.donate.donationPosted': 'Donation Posted!',
  'donor.donate.donationPostedMessage': 'Thank you for sharing food.\nYour donation is now visible to receivers.',
  'donor.donate.titleRequired': 'Please add a food title.',
  'donor.donate.dateRequired': 'Please select an expiration date.',
  'donor.donate.assuranceRequired': 'Please assure food quality before submitting.',
  'donor.donate.permissionRequired': 'Permission to access photo library is required.',
  'donor.donate.createFailed': 'Failed to create donation.',
};

export const donorVi: Record<DonorKey, string> = {
  'donor.greeting': 'Xin chào',
  'donor.greetingFallback': 'bạn',
  'donor.rolePrefix': 'Bạn là',
  'donor.role': 'Người cho',
  'donor.level.newMember': 'Thành viên mới',
  'donor.level.bronzeDonor': 'Người cho đồng',
  'donor.level.silverDonor': 'Người cho bạc',
  'donor.level.goldDonor': 'Người cho vàng',
  'donor.level.superDonor': 'Siêu người cho',
  'donor.level.legend': 'Huyền thoại',
  'donor.stats.donations': 'Số lượt ủng hộ',
  'donor.stats.feedback': 'Phản hồi đã nhận',
  'donor.stats.points': 'Điểm đã nhận',
  'donor.impact.title': 'Đóng góp của bạn',
  'donor.impact.donationsLabel': 'Lượt ủng hộ',
  'donor.impact.portionsLabel': 'Suất đã chia sẻ',
  'donor.impact.message': 'Cảm ơn bạn đã tạo nên sự khác biệt!',
  'donor.tab.myPost': 'Bài đăng của tôi',
  'donor.tab.requests': 'Yêu cầu từ người nhận',
  'donor.empty.promptDonate': 'Bạn có thực phẩm muốn ủng hộ không?',
  'donor.empty.createMoreDonation': '+ Tạo thêm bài ủng hộ',
  'donor.empty.nothingYet': 'Chưa có dữ liệu',
  'donor.empty.createDonationPost': '+ Tạo bài ủng hộ',
  'donor.receiverRequests.title': 'Yêu cầu thực phẩm từ người nhận',
  'donor.request.label': 'Yêu cầu',
  'donor.qty.label': 'Số lượng',
  'donor.preference.label': 'Tùy chọn',
  'donor.neededBefore.label': 'Cần trước',
  'donor.accepting': 'Đang tiếp nhận...',
  'donor.accept': 'Tiếp nhận',
  'donor.receiverFallback': 'Người nhận',
  'donor.donationLabel': 'Ủng hộ',
  'donor.phoneLabel': 'Điện thoại',
  'donor.rejecting': 'Đang từ chối...',
  'donor.reject': 'Từ chối',
  'donor.approving': 'Đang duyệt...',
  'donor.approve': 'Duyệt',
  'donor.approvedRequestsTitle': 'Yêu cầu đã duyệt',
  'donor.delivery.viaAgent': 'Qua tình nguyện viên',
  'donor.delivery.selfPickup': 'Tự nhận',
  'donor.delivery.awaitingChoice': 'Chờ chọn',
  'donor.openingChat': 'Đang mở chat...',
  'donor.chatWithVolunteer': 'Chat với tình nguyện viên',
  'donor.noReceiverRequests': 'Chưa có yêu cầu',
  'donor.history.title': 'Lịch sử ủng hộ',
  'donor.history.searchPlaceholder': 'Tìm kiếm theo tiêu đề, trạng thái hoặc ID',
  'donor.history.loading': 'Đang tải lịch sử ủng hộ...',
  'donor.history.tryAgain': 'Thử lại',
  'donor.history.noMatch': 'Không có ủng hộ nào phù hợp với tìm kiếm của bạn.',
  'donor.history.noYet': 'Bạn chưa đăng bất kỳ bài ủng hộ nào.',
  'donor.history.loadFailed': 'Không thể tải lịch sử ủng hộ của bạn.',
  'donor.viewAll': 'Xem tất cả',
  'donor.noDonationsYet': 'Chưa có ủng hộ',
  'donor.ngo.title': 'Tổ chức gần bạn',
  'donor.seeMore': 'Xem thêm',
  'donor.noNgosYet': 'Chưa có tổ chức',
  'donor.faq.title': 'Câu hỏi thường gặp',
  'donor.faq.pickup': 'Ai sẽ lấy thực phẩm?',
  'donor.faq.oneTime': 'Có thể ủng hộ một lần không?',
  'donor.notSpecified': 'Chưa xác định',
  'donor.portion': 'suất',
  'donor.foodPreference.veg': 'Đồ chay',
  'donor.foodPreference.nonVeg': 'Đồ mặn',
  'donor.foodPreference.vegAndNonVeg': 'Cả chay & mặn',
  'donor.alert.approveTitle': 'Đã duyệt',
  'donor.alert.approveBody': 'Đã duyệt yêu cầu từ người nhận.',
  'donor.alert.approveFailedTitle': 'Duyệt thất bại',
  'donor.alert.approveFailedBody': 'Vui lòng thử lại.',
  'donor.alert.rejectTitle': 'Đã từ chối',
  'donor.alert.rejectBody': 'Đã từ chối yêu cầu từ người nhận.',
  'donor.alert.rejectFailedTitle': 'Từ chối thất bại',
  'donor.alert.rejectFailedBody': 'Vui lòng thử lại.',
  'donor.alert.acceptSuccessTitle': 'Tiếp nhận thành công',
  'donor.alert.acceptSuccessBody': 'Đã tiếp nhận yêu cầu từ người nhận.',
  'donor.alert.acceptFailedTitle': 'Không thể tiếp nhận',
  'donor.alert.acceptFailedBody': 'Vui lòng thử lại.',
  'donor.alert.chatCreateFailed': 'Không tạo được cuộc trò chuyện.',
  'donor.chatTitleFallback': 'Chat tình nguyện viên',
  'donor.alert.chatOpenFailedTitle': 'Không thể mở chat',
  'donor.alert.chatOpenFailedBody': 'Vui lòng thử lại.',
  'donor.cancel.button': 'Huỷ đơn',
  'donor.cancel.cancelling': 'Đang huỷ...',
  'donor.cancel.confirmTitle': 'Huỷ đơn này?',
  'donor.cancel.confirmMessage': 'Đơn sẽ được đánh dấu là đã huỷ. Receiver và volunteer (nếu có) sẽ được thông báo.',
  'donor.cancel.confirmYes': 'Huỷ đơn',
  'donor.cancel.confirmNo': 'Giữ lại',
  'donor.cancel.successTitle': 'Đã huỷ',
  'donor.cancel.successBody': 'Đơn đã được huỷ.',
  'donor.cancel.failedTitle': 'Không huỷ được',
  'donor.cancel.failedBody': 'Vui lòng thử lại.',
  'donor.pickupCode.title': 'Mã pickup',
  'donor.pickupCode.hint': 'Đọc mã này cho volunteer khi gặp để xác minh.',
  'donor.donate.header': 'Loại bài đăng: Ủng hộ',
  'donor.donate.addTitle': 'Thêm tiêu đề',
  'donor.donate.addTitlePlaceholder': 'Thêm tiêu đề thực phẩm',
  'donor.donate.description': 'Mô tả:',
  'donor.donate.descPlaceholder': 'Ví dụ: cà chua từ vườn.\nCung cấp càng nhiều chi tiết càng tốt để tăng\nkhả năng cho đi vật của bạn\nnhanh chóng.',
  'donor.donate.typeOfFood': 'Loại thực phẩm',
  'donor.donate.cookedFood': 'Thực phẩm nấu chín',
  'donor.donate.fruitsVegetables': 'Trái cây & Rau quả',
  'donor.donate.packagedFood': 'Thực phẩm đóng gói',
  'donor.donate.frozenFood': 'Thực phẩm đông lạnh',
  'donor.donate.foodQuantity': 'Số lượng thực phẩm',
  'donor.donate.selectYourMeal': 'Chọn bữa ăn của bạn',
  'donor.donate.photos': 'Hình ảnh:',
  'donor.donate.addMore': '+Thêm nhiều hơn',
  'donor.donate.expirationDate': 'Ngày hết hạn',
  'donor.donate.expirationTime': 'Thời gian hết hạn',
  'donor.donate.dateFormat': 'DD MMM YYYY',
  'donor.donate.timeFormat': 'HH:MM AM/PM',
  'donor.donate.qualityAssurance': 'Đảm bảo chất lượng',
  'donor.donate.assuranceText': 'Tôi đảm bảo rằng chất lượng thực phẩm và vệ sinh đã được duy trì',
  'donor.donate.submit': 'Gửi',
  'donor.donate.donateAgain': 'Ủng hộ lại',
  'donor.donate.viewMyPosts': 'Xem bài đăng của tôi',
  'donor.donate.donationPosted': 'Bài ủng hộ đã đăng!',
  'donor.donate.donationPostedMessage': 'Cảm ơn bạn đã chia sẻ thực phẩm.\nBài ủng hộ của bạn hiện đã hiển thị cho những người nhận.',
  'donor.donate.titleRequired': 'Vui lòng thêm tiêu đề thực phẩm.',
  'donor.donate.dateRequired': 'Vui lòng chọn ngày hết hạn.',
  'donor.donate.assuranceRequired': 'Vui lòng đảm bảo chất lượng thực phẩm trước khi gửi.',
  'donor.donate.permissionRequired': 'Cần cấp quyền truy cập thư viện ảnh.',
  'donor.donate.createFailed': 'Không thể tạo bài ủng hộ.',
};
