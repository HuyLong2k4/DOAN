export type DonorKey =
  | 'donor.greeting'
  | 'donor.rolePrefix'
  | 'donor.role'
  | 'donor.stats.donations'
  | 'donor.stats.points'
  | 'donor.tab.myPost'
  | 'donor.tab.requests'
  | 'donor.empty.promptDonate'
  | 'donor.empty.createMoreDonation'
  | 'donor.empty.nothingYet'
  | 'donor.empty.createDonationPost'
  | 'donor.receiverRequests.title'
  | 'donor.request.label'
  | 'donor.qty.label'
  | 'donor.neededBefore.label'
  | 'donor.accepting'
  | 'donor.accept'
  | 'donor.requestAccepted'
  | 'donor.viewDonation'
  | 'donor.receiverFallback'
  | 'donor.donationLabel'
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
  | 'donor.faq.title'
  | 'donor.faq.pickup'
  | 'donor.faq.oneTime'
  | 'donor.notSpecified'
  | 'donor.portion'
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
  | 'donor.releaseReceiver.button'
  | 'donor.releaseReceiver.releasing'
  | 'donor.releaseReceiver.confirmTitle'
  | 'donor.releaseReceiver.confirmMessage'
  | 'donor.releaseReceiver.confirmYes'
  | 'donor.releaseReceiver.confirmNo'
  | 'donor.releaseReceiver.successTitle'
  | 'donor.releaseReceiver.successBody'
  | 'donor.releaseReceiver.failedTitle'
  | 'donor.releaseReceiver.waitingTitle'
  | 'donor.releaseReceiver.staleTitle'
  | 'donor.releaseReceiver.staleMessage'
  | 'donor.releaseReceiver.connectedAtPrefix'
  | 'donor.releaseReceiver.minutesShort'
  | 'donor.releaseReceiver.eligibleInPrefix'
  | 'donor.releaseReceiver.fromRequestButton'
  | 'donor.releaseReceiver.fromRequestConfirmTitle'
  | 'donor.releaseReceiver.fromRequestConfirmMessage'
  | 'donor.releaseReceiver.fromRequestSuccessBody'
  | 'donor.releaseReceiver.fromRequestStaleMessage'
  | 'donor.pickupCode.title'
  | 'donor.pickupCode.hint'
  | 'donor.pickupCode.hintSelfPickup'
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
  | 'donor.donate.photos'
  | 'donor.donate.addMore'
  | 'donor.donate.expirationDate'
  | 'donor.donate.expirationTime'
  | 'donor.donate.dateFormat'
  | 'donor.donate.timeFormat'
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
  | 'donor.donate.maxPhotosReached'
  | 'donor.donate.createFailed';

export const donorEn: Record<DonorKey, string> = {
  'donor.greeting': 'Hi',
  'donor.rolePrefix': 'You are a',
  'donor.role': 'Donor',
  'donor.stats.donations': 'No of Donations',
  'donor.stats.points': 'Points earned',
  'donor.tab.myPost': 'My Post',
  'donor.tab.requests': 'Receiver Requests',
  'donor.empty.promptDonate': 'Do you have some food to donate?',
  'donor.empty.createMoreDonation': '+ Create More Donation',
  'donor.empty.nothingYet': 'Nothing till now',
  'donor.empty.createDonationPost': '+ Create Donation Post',
  'donor.receiverRequests.title': 'Receiver Food Requests',
  'donor.request.label': 'Request',
  'donor.qty.label': 'Qty',
  'donor.neededBefore.label': 'Needed before',
  'donor.accepting': 'Accepting...',
  'donor.accept': 'Accept',
  'donor.requestAccepted': 'Accepted',
  'donor.viewDonation': 'View donation',
  'donor.receiverFallback': 'Receiver',
  'donor.donationLabel': 'Donation',
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
  'donor.faq.title': 'FAQs',
  'donor.faq.pickup': 'Who will pick up the food?',
  'donor.faq.oneTime': 'Can we perform one-time donations?',
  'donor.notSpecified': 'Not specified',
  'donor.portion': 'portion',
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
  'donor.releaseReceiver.button': 'Release receiver',
  'donor.releaseReceiver.releasing': 'Releasing...',
  'donor.releaseReceiver.confirmTitle': 'Release this receiver?',
  'donor.releaseReceiver.confirmMessage': 'The donation will go back to pending so another receiver can connect. The receiver and assigned volunteer (if any) will be notified.',
  'donor.releaseReceiver.confirmYes': 'Release',
  'donor.releaseReceiver.confirmNo': 'Keep waiting',
  'donor.releaseReceiver.successTitle': 'Receiver released',
  'donor.releaseReceiver.successBody': 'Donation is available again for other receivers.',
  'donor.releaseReceiver.failedTitle': 'Cannot release',
  'donor.releaseReceiver.waitingTitle': 'Waiting for pickup',
  'donor.releaseReceiver.staleTitle': 'Pickup overdue',
  'donor.releaseReceiver.staleMessage': 'No one has picked up in 30+ minutes. You can release the receiver or keep waiting.',
  'donor.releaseReceiver.connectedAtPrefix': 'Connected',
  'donor.releaseReceiver.minutesShort': 'min',
  'donor.releaseReceiver.eligibleInPrefix': 'Can release in',
  'donor.releaseReceiver.fromRequestButton': 'Cancel & reopen request',
  'donor.releaseReceiver.fromRequestConfirmTitle': 'Cancel donation?',
  'donor.releaseReceiver.fromRequestConfirmMessage': 'This donation was created for the receiver\'s request. Cancelling will mark the donation as cancelled and reopen the receiver\'s food request so another donor can accept it.',
  'donor.releaseReceiver.fromRequestSuccessBody': 'Donation cancelled. The receiver\'s food request is open again.',
  'donor.releaseReceiver.fromRequestStaleMessage': 'No pickup in 30+ minutes. You can cancel this donation and the receiver\'s request will reopen.',
  'donor.pickupCode.title': 'Pickup code',
  'donor.pickupCode.hint': 'Read this code aloud to the volunteer when they arrive.',
  'donor.pickupCode.hintSelfPickup': 'Read this code aloud to the receiver when they arrive to pick up.',
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
  'donor.donate.photos': 'Photos:',
  'donor.donate.addMore': '+Add more',
  'donor.donate.expirationDate': 'Expiration Date',
  'donor.donate.expirationTime': 'Expiration Time',
  'donor.donate.dateFormat': 'DD MMM YYYY',
  'donor.donate.timeFormat': 'HH:MM AM/PM',
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
  'donor.donate.maxPhotosReached': 'You can attach up to 6 photos only.',
  'donor.donate.createFailed': 'Failed to create donation.',
};

export const donorVi: Record<DonorKey, string> = {
  'donor.greeting': 'Xin chào',
  'donor.rolePrefix': 'Bạn là',
  'donor.role': 'Người cho',
  'donor.stats.donations': 'Số lượt ủng hộ',
  'donor.stats.points': 'Điểm đã nhận',
  'donor.tab.myPost': 'Bài đăng của tôi',
  'donor.tab.requests': 'Yêu cầu từ người nhận',
  'donor.empty.promptDonate': 'Bạn có thực phẩm muốn ủng hộ không?',
  'donor.empty.createMoreDonation': '+ Tạo thêm bài ủng hộ',
  'donor.empty.nothingYet': 'Chưa có dữ liệu',
  'donor.empty.createDonationPost': '+ Tạo bài ủng hộ',
  'donor.receiverRequests.title': 'Yêu cầu thực phẩm từ người nhận',
  'donor.request.label': 'Yêu cầu',
  'donor.qty.label': 'Số lượng',
  'donor.neededBefore.label': 'Cần trước',
  'donor.accepting': 'Đang tiếp nhận...',
  'donor.accept': 'Tiếp nhận',
  'donor.requestAccepted': 'Đã tiếp nhận',
  'donor.viewDonation': 'Xem đơn',
  'donor.receiverFallback': 'Người nhận',
  'donor.donationLabel': 'Ủng hộ',
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
  'donor.faq.title': 'Câu hỏi thường gặp',
  'donor.faq.pickup': 'Ai sẽ lấy thực phẩm?',
  'donor.faq.oneTime': 'Có thể ủng hộ một lần không?',
  'donor.notSpecified': 'Chưa xác định',
  'donor.portion': 'suất',
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
  'donor.releaseReceiver.button': 'Giải phóng receiver',
  'donor.releaseReceiver.releasing': 'Đang giải phóng...',
  'donor.releaseReceiver.confirmTitle': 'Giải phóng receiver này?',
  'donor.releaseReceiver.confirmMessage': 'Đơn sẽ trở lại trạng thái chờ để receiver khác kết nối. Receiver và volunteer (nếu có) sẽ được thông báo.',
  'donor.releaseReceiver.confirmYes': 'Giải phóng',
  'donor.releaseReceiver.confirmNo': 'Tiếp tục giữ',
  'donor.releaseReceiver.successTitle': 'Đã giải phóng receiver',
  'donor.releaseReceiver.successBody': 'Đơn sẵn sàng cho receiver khác kết nối.',
  'donor.releaseReceiver.failedTitle': 'Không giải phóng được',
  'donor.releaseReceiver.waitingTitle': 'Đang chờ lấy hàng',
  'donor.releaseReceiver.staleTitle': 'Quá thời gian lấy hàng',
  'donor.releaseReceiver.staleMessage': 'Đã quá 30 phút mà chưa ai đến lấy. Bạn có thể giải phóng receiver hoặc tiếp tục giữ.',
  'donor.releaseReceiver.connectedAtPrefix': 'Đã kết nối',
  'donor.releaseReceiver.minutesShort': 'phút',
  'donor.releaseReceiver.eligibleInPrefix': 'Có thể giải phóng sau',
  'donor.releaseReceiver.fromRequestButton': 'Huỷ đơn & mở lại request',
  'donor.releaseReceiver.fromRequestConfirmTitle': 'Huỷ đơn này?',
  'donor.releaseReceiver.fromRequestConfirmMessage': 'Đơn này được tạo từ food request của receiver. Huỷ đơn sẽ đánh dấu đơn là đã huỷ và mở lại food request của receiver để donor khác có thể accept.',
  'donor.releaseReceiver.fromRequestSuccessBody': 'Đã huỷ đơn. Food request của receiver đã được mở lại.',
  'donor.releaseReceiver.fromRequestStaleMessage': 'Đã quá 30 phút mà chưa ai đến lấy. Bạn có thể huỷ đơn và food request của receiver sẽ được mở lại.',
  'donor.pickupCode.title': 'Mã pickup',
  'donor.pickupCode.hint': 'Đọc mã này cho volunteer khi gặp để xác minh.',
  'donor.pickupCode.hintSelfPickup': 'Đọc mã này cho receiver khi họ đến lấy hàng.',
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
  'donor.donate.photos': 'Hình ảnh:',
  'donor.donate.addMore': '+Thêm nhiều hơn',
  'donor.donate.expirationDate': 'Ngày hết hạn',
  'donor.donate.expirationTime': 'Thời gian hết hạn',
  'donor.donate.dateFormat': 'DD MMM YYYY',
  'donor.donate.timeFormat': 'HH:MM AM/PM',
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
  'donor.donate.maxPhotosReached': 'Chỉ được đính kèm tối đa 6 ảnh.',
  'donor.donate.createFailed': 'Không thể tạo bài ủng hộ.',
};
