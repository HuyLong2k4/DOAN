export type CommonKey =
  | 'tab.home'
  | 'tab.message'
  | 'tab.profile'
  | 'profile.title'
  | 'profile.personalInfo'
  | 'profile.yourDonations'
  | 'profile.yourDeliveries'
  | 'profile.rewards'
  | 'profile.myActivity'
  | 'profile.settings'
  | 'profile.help'
  | 'help.title'
  | 'help.faqTitle'
  | 'help.contactTitle'
  | 'help.email'
  | 'help.phone'
  | 'help.tapEmail'
  | 'help.tapPhone'
  | 'help.q1'
  | 'help.a1'
  | 'help.q2'
  | 'help.a2'
  | 'help.q3'
  | 'help.a3'
  | 'profile.signOut'
  | 'profile.signOutTitle'
  | 'profile.signOutConfirm'
  | 'profile.cancel'
  | 'profile.languageEnglish'
  | 'profile.languageVietnamese'
  | 'settings.title'
  | 'settings.languageSection'
  | 'settings.changePasswordSection'
  | 'settings.oldPassword'
  | 'settings.newPassword'
  | 'settings.confirmPassword'
  | 'settings.changePasswordBtn'
  | 'settings.passwordRequired'
  | 'settings.passwordTooShort'
  | 'settings.passwordMismatch'
  | 'settings.changePasswordSuccessTitle'
  | 'settings.changePasswordSuccessBody'
  | 'settings.changePasswordFailed'
  | 'donation.status.volunteerOnWay'
  | 'donation.status.inTransit'
  | 'donation.status.completed'
  | 'donation.status.expired'
  | 'donation.justNow'
  | 'donation.oneDay'
  | 'common.cancel'
  | 'message.title'
  | 'message.empty'
  | 'message.startConversation'
  | 'message.unknownUser'
  | 'notifications.title'
  | 'notifications.empty'
  | 'notifications.errorLoad'
  | 'notifications.timeJustNow'
  | 'notifications.timeMinutes'
  | 'notifications.timeHours'
  | 'notifications.timeDays'
  | 'personalInfo.title'
  | 'personalInfo.changeAvatar'
  | 'personalInfo.avatarUploadFailed'
  | 'personalInfo.permissionDenied'
  | 'personalInfo.pinLocation'
  | 'personalInfo.set'
  | 'personalInfo.notSet'
  | 'personalInfo.loading'
  | 'personalInfo.addressLabel'
  | 'personalInfo.fullName'
  | 'personalInfo.email'
  | 'personalInfo.phone'
  | 'personalInfo.role'
  | 'personalInfo.phoneVerification'
  | 'personalInfo.verified'
  | 'personalInfo.notVerified'
  | 'personalInfo.profileStatus'
  | 'personalInfo.completed'
  | 'personalInfo.incomplete'
  | 'personalInfo.fetchingPin'
  | 'personalInfo.notUpdated'
  | 'personalInfo.locationNotPinned'
  | 'personalInfo.editProfile'
  | 'personalInfo.editTitle'
  | 'personalInfo.save'
  | 'personalInfo.cancel'
  | 'personalInfo.nameRequired'
  | 'personalInfo.phoneInvalid'
  | 'personalInfo.updateSuccess'
  | 'personalInfo.updateFailed'
  | 'personalInfo.emailInvalid'
  | 'pantry.qty';

export const commonEn: Record<CommonKey, string> = {
  'tab.home': 'Home',
  'tab.message': 'Message',
  'tab.profile': 'Profile',
  'profile.title': 'My Profile',
  'profile.personalInfo': 'Personal Info',
  'profile.yourDonations': 'Your Donations',
  'profile.yourDeliveries': 'Your Deliveries',
  'profile.rewards': 'Achievement',
  'profile.myActivity': 'My Activity',
  'profile.settings': 'Settings',
  'profile.help': 'Help and Support',
  'help.title': 'Help and Support',
  'help.faqTitle': 'Frequently asked questions',
  'help.contactTitle': 'Contact us',
  'help.email': 'support@foodshare.app',
  'help.phone': '+84 24 6688 0000',
  'help.tapEmail': 'Tap to send email',
  'help.tapPhone': 'Tap to call',
  'help.q1': 'How do I create a donation?',
  'help.a1': 'Open the home screen, tap "Donate", fill in the food details (type, quantity, expiration time and pickup address), then publish. Receivers and volunteers nearby will see your post.',
  'help.q2': 'How do I earn points?',
  'help.a2': 'Donors earn points each time a donation is completed; volunteers earn points each time they finish a delivery. Points are shown on your Achievement screen and the leaderboard.',
  'help.q3': 'I cannot receive food. What should I do?',
  'help.a3': 'Make sure your profile is complete and you have pinned your location on the map. Check the home screen for nearby donors and accept any donation that fits your needs.',
  'profile.signOut': 'Sign Out',
  'profile.signOutTitle': 'Sign Out',
  'profile.signOutConfirm': 'Are you sure you want to sign out?',
  'profile.cancel': 'Cancel',
  'profile.languageEnglish': 'English',
  'profile.languageVietnamese': 'Vietnamese',
  'settings.title': 'Settings',
  'settings.languageSection': 'Language',
  'settings.changePasswordSection': 'Change password',
  'settings.oldPassword': 'Current password',
  'settings.newPassword': 'New password',
  'settings.confirmPassword': 'Confirm new password',
  'settings.changePasswordBtn': 'Update password',
  'settings.passwordRequired': 'Please fill in all password fields.',
  'settings.passwordTooShort': 'New password must be at least 6 characters.',
  'settings.passwordMismatch': 'New password and confirmation do not match.',
  'settings.changePasswordSuccessTitle': 'Password updated',
  'settings.changePasswordSuccessBody': 'You have been signed out. Please sign in again with your new password.',
  'settings.changePasswordFailed': 'Could not change password.',
  'donation.status.volunteerOnWay': 'Volunteer is on the way!',
  'donation.status.inTransit': 'Food picked up — in transit',
  'donation.status.completed': 'Completed — thank you!',
  'donation.status.expired': 'Expired — no one claimed it',
  'donation.justNow': 'Just now',
  'donation.oneDay': '1 day ago',
  'common.cancel': 'Cancel',
  'message.title': 'Messages',
  'message.empty': 'No conversations yet.',
  'message.startConversation': 'Start conversation',
  'message.unknownUser': 'Unknown user',
  'notifications.title': 'Notifications',
  'notifications.empty': 'No notifications yet',
  'notifications.errorLoad': 'Cannot load notifications.',
  'notifications.timeJustNow': 'Just now',
  'notifications.timeMinutes': '{n}m ago',
  'notifications.timeHours': '{n}h ago',
  'notifications.timeDays': '{n}d ago',
  'personalInfo.title': 'Personal Info',
  'personalInfo.changeAvatar': 'Change avatar',
  'personalInfo.avatarUploadFailed': 'Could not update your avatar.',
  'personalInfo.permissionDenied': 'Permission to access photos was denied.',
  'personalInfo.pinLocation': 'Pin Location',
  'personalInfo.set': 'Set',
  'personalInfo.notSet': 'Not set',
  'personalInfo.loading': 'Loading...',
  'personalInfo.addressLabel': 'Address (self-reported)',
  'personalInfo.fullName': 'Full Name',
  'personalInfo.email': 'Email',
  'personalInfo.phone': 'Phone Number',
  'personalInfo.role': 'Role',
  'personalInfo.phoneVerification': 'Phone Verification',
  'personalInfo.verified': 'Verified',
  'personalInfo.notVerified': 'Not verified',
  'personalInfo.profileStatus': 'Profile Status',
  'personalInfo.completed': 'Completed',
  'personalInfo.incomplete': 'Incomplete',
  'personalInfo.fetchingPin': 'Fetching pin location...',
  'personalInfo.notUpdated': 'Not updated',
  'personalInfo.locationNotPinned': 'User has not pinned location on map yet.',
  'personalInfo.editProfile': 'Edit info',
  'personalInfo.editTitle': 'Edit personal info',
  'personalInfo.save': 'Save',
  'personalInfo.cancel': 'Cancel',
  'personalInfo.nameRequired': 'Please enter your full name.',
  'personalInfo.phoneInvalid': 'Please enter a valid phone number.',
  'personalInfo.updateSuccess': 'Your information has been updated.',
  'personalInfo.updateFailed': 'Could not update your information.',
  'personalInfo.emailInvalid': 'Please enter a valid email address.',
  'pantry.qty': 'Qty:',
};

export const commonVi: Record<CommonKey, string> = {
  'tab.home': 'Trang chủ',
  'tab.message': 'Tin nhắn',
  'tab.profile': 'Cá nhân',
  'profile.title': 'Hồ sơ của tôi',
  'profile.personalInfo': 'Thông tin cá nhân',
  'profile.yourDonations': 'Khoản ủng hộ của bạn',
  'profile.yourDeliveries': 'Đơn bạn đã giao',
  'profile.rewards': 'Thành tích',
  'profile.myActivity': 'Hoạt động của tôi',
  'profile.settings': 'Cài đặt',
  'profile.help': 'Trợ giúp & Hỗ trợ',
  'help.title': 'Trợ giúp & Hỗ trợ',
  'help.faqTitle': 'Câu hỏi thường gặp',
  'help.contactTitle': 'Liên hệ với chúng tôi',
  'help.email': 'support@foodshare.app',
  'help.phone': '+84 24 6688 0000',
  'help.tapEmail': 'Nhấn để gửi email',
  'help.tapPhone': 'Nhấn để gọi',
  'help.q1': 'Tôi tạo bài ủng hộ thế nào?',
  'help.a1': 'Mở màn Trang chủ, bấm "Ủng hộ", điền thông tin thực phẩm (loại, số lượng, thời gian hết hạn, địa chỉ nhận hàng) rồi đăng. Người nhận và tình nguyện viên gần bạn sẽ thấy bài đăng.',
  'help.q2': 'Tôi tích điểm bằng cách nào?',
  'help.a2': 'Người ủng hộ nhận điểm khi đơn được hoàn thành; tình nguyện viên nhận điểm sau mỗi lần giao hàng. Điểm hiển thị trong mục Thành tích và bảng xếp hạng.',
  'help.q3': 'Tôi không nhận được thức ăn, phải làm gì?',
  'help.a3': 'Hãy hoàn tất thông tin cá nhân và ghim vị trí trên bản đồ. Xem mục người tặng gần bạn ở Trang chủ và nhận đơn phù hợp.',
  'profile.signOut': 'Đăng xuất',
  'profile.signOutTitle': 'Đăng xuất',
  'profile.signOutConfirm': 'Bạn có chắc chắn muốn đăng xuất không?',
  'profile.cancel': 'Hủy',
  'profile.languageEnglish': 'Tiếng Anh',
  'profile.languageVietnamese': 'Tiếng Việt',
  'settings.title': 'Cài đặt',
  'settings.languageSection': 'Ngôn ngữ',
  'settings.changePasswordSection': 'Đổi mật khẩu',
  'settings.oldPassword': 'Mật khẩu hiện tại',
  'settings.newPassword': 'Mật khẩu mới',
  'settings.confirmPassword': 'Xác nhận mật khẩu mới',
  'settings.changePasswordBtn': 'Cập nhật mật khẩu',
  'settings.passwordRequired': 'Vui lòng nhập đầy đủ các ô mật khẩu.',
  'settings.passwordTooShort': 'Mật khẩu mới phải có ít nhất 6 ký tự.',
  'settings.passwordMismatch': 'Mật khẩu mới và xác nhận không khớp.',
  'settings.changePasswordSuccessTitle': 'Cập nhật mật khẩu thành công',
  'settings.changePasswordSuccessBody': 'Bạn đã được đăng xuất. Vui lòng đăng nhập lại bằng mật khẩu mới.',
  'settings.changePasswordFailed': 'Không thể đổi mật khẩu.',
  'donation.status.volunteerOnWay': 'Tình nguyện viên đang trên đường!',
  'donation.status.inTransit': 'Thực phẩm được lấy — đang vận chuyển',
  'donation.status.completed': 'Hoàn tất — cảm ơn bạn!',
  'donation.status.expired': 'Hết hạn — không ai nhận',
  'donation.justNow': 'Vừa xong',
  'donation.oneDay': '1 ngày trước',
  'common.cancel': 'Hủy',
  'message.title': 'Tin nhắn',
  'message.empty': 'Bạn chưa có cuộc trò chuyện nào.',
  'message.startConversation': 'Bắt đầu trò chuyện',
  'message.unknownUser': 'Người dùng không rõ',
  'notifications.title': 'Thông báo',
  'notifications.empty': 'Chưa có thông báo',
  'notifications.errorLoad': 'Không thể tải thông báo.',
  'notifications.timeJustNow': 'Vừa xong',
  'notifications.timeMinutes': '{n} phút trước',
  'notifications.timeHours': '{n} giờ trước',
  'notifications.timeDays': '{n} ngày trước',
  'personalInfo.title': 'Thông tin cá nhân',
  'personalInfo.changeAvatar': 'Đổi ảnh đại diện',
  'personalInfo.avatarUploadFailed': 'Không thể cập nhật ảnh đại diện.',
  'personalInfo.permissionDenied': 'Không có quyền truy cập ảnh.',
  'personalInfo.pinLocation': 'Vị trí đã ghim',
  'personalInfo.set': 'Đã đặt',
  'personalInfo.notSet': 'Chưa đặt',
  'personalInfo.loading': 'Đang tải...',
  'personalInfo.addressLabel': 'Địa chỉ (tự khai)',
  'personalInfo.fullName': 'Họ và tên',
  'personalInfo.email': 'Email',
  'personalInfo.phone': 'Số điện thoại',
  'personalInfo.role': 'Vai trò',
  'personalInfo.phoneVerification': 'Xác minh số điện thoại',
  'personalInfo.verified': 'Đã xác minh',
  'personalInfo.notVerified': 'Chưa xác minh',
  'personalInfo.profileStatus': 'Trạng thái hồ sơ',
  'personalInfo.completed': 'Hoàn tất',
  'personalInfo.incomplete': 'Chưa hoàn tất',
  'personalInfo.fetchingPin': 'Đang tải vị trí...',
  'personalInfo.notUpdated': 'Chưa cập nhật',
  'personalInfo.locationNotPinned': 'Người dùng chưa ghim vị trí trên bản đồ.',
  'personalInfo.editProfile': 'Sửa thông tin',
  'personalInfo.editTitle': 'Sửa thông tin cá nhân',
  'personalInfo.save': 'Lưu',
  'personalInfo.cancel': 'Huỷ',
  'personalInfo.nameRequired': 'Vui lòng nhập họ và tên.',
  'personalInfo.phoneInvalid': 'Số điện thoại không hợp lệ.',
  'personalInfo.updateSuccess': 'Đã cập nhật thông tin của bạn.',
  'personalInfo.updateFailed': 'Không thể cập nhật thông tin.',
  'personalInfo.emailInvalid': 'Email không hợp lệ.',
  'pantry.qty': 'SL:',
};
