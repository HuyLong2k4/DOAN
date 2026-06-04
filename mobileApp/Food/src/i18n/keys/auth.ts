export type AuthKey =
  | 'auth.login.title'
  | 'auth.login.subtitle'
  | 'auth.login.phonePlaceholder'
  | 'auth.login.passwordPlaceholder'
  | 'auth.login.rememberMe'
  | 'auth.login.forgotPassword'
  | 'auth.login.noAccount'
  | 'auth.login.signUp'
  | 'auth.login.btn'
  | 'auth.login.errorEmpty'
  | 'auth.login.errorFailed'
  | 'auth.register.title'
  | 'auth.register.subtitle'
  | 'auth.register.fullNamePlaceholder'
  | 'auth.register.phonePlaceholder'
  | 'auth.register.passwordPlaceholder'
  | 'auth.register.confirmPlaceholder'
  | 'auth.register.btn'
  | 'auth.register.haveAccount'
  | 'auth.register.loginLink'
  | 'auth.register.errorEmpty'
  | 'auth.register.errorPasswordMatch'
  | 'auth.register.errorPasswordLength'
  | 'auth.register.errorFailed'
  | 'auth.otp.title'
  | 'auth.otp.sentTo'
  | 'auth.otp.resendIn'
  | 'auth.otp.verify'
  | 'auth.otp.noCode'
  | 'auth.otp.errorLength'
  | 'auth.otp.errorInvalid'
  | 'auth.otp.errorResend'
  | 'auth.forgot.title'
  | 'auth.forgot.subtitle'
  | 'auth.forgot.placeholder'
  | 'auth.forgot.sendOtp'
  | 'auth.forgot.backToLogin'
  | 'auth.forgot.errorEmpty'
  | 'auth.forgot.errorNotFound'
  | 'auth.reset.title'
  | 'auth.reset.subtitle'
  | 'auth.reset.newPassword'
  | 'auth.reset.confirmPassword'
  | 'auth.reset.confirm'
  | 'auth.reset.successTitle'
  | 'auth.reset.successMsg'
  | 'auth.reset.backToLogin'
  | 'auth.reset.errorEmpty'
  | 'auth.reset.errorLength'
  | 'auth.reset.errorMatch'
  | 'auth.reset.errorFailed'
  | 'auth.confirm.defaultErrorTitle'
  | 'auth.confirm.defaultSuccessTitle'
  | 'auth.confirm.defaultErrorMsg'
  | 'auth.confirm.defaultSuccessMsg'
  | 'auth.confirm.tryAgain'
  | 'auth.role.title'
  | 'auth.role.subtitle'
  | 'auth.role.donorLabel'
  | 'auth.role.donorDesc'
  | 'auth.role.receiverLabel'
  | 'auth.role.receiverDesc'
  | 'auth.role.volunteerLabel'
  | 'auth.role.volunteerDesc'
  | 'auth.role.continue'
  | 'auth.role.errorSelect'
  | 'auth.details.orgName'
  | 'auth.details.orgNamePlaceholder'
  | 'auth.details.contactName'
  | 'auth.details.contactNamePlaceholder'
  | 'auth.details.email'
  | 'auth.details.addressLine'
  | 'auth.details.addressLinePlaceholder'
  | 'auth.details.city'
  | 'auth.details.cityPlaceholder'
  | 'auth.details.or'
  | 'auth.details.pinLocation'
  | 'auth.details.locationPinned'
  | 'auth.details.editManually'
  | 'auth.details.submit'
  | 'auth.details.errorOrgName'
  | 'auth.details.errorAddress'
  | 'auth.details.errorGeneric'
  | 'auth.donor.title'
  | 'auth.donor.subtitle'
  | 'auth.donor.type'
  | 'auth.donor.restaurant'
  | 'auth.donor.bakery'
  | 'auth.donor.individual'
  | 'auth.receiver.title'
  | 'auth.receiver.subtitle'
  | 'auth.receiver.type'
  | 'auth.receiver.individual'
  | 'auth.receiver.ngo'
  | 'auth.receiver.orphanage'
  | 'auth.receiver.shelter'
  | 'auth.volunteer.title'
  | 'auth.volunteer.subtitle'
  | 'auth.volunteer.fullName'
  | 'auth.volunteer.fullNamePlaceholder'
  | 'auth.volunteer.vehicleType'
  | 'auth.volunteer.vehiclePlaceholder'
  | 'auth.volunteer.vehicleLicense'
  | 'auth.volunteer.licensePlaceholder'
  | 'auth.volunteer.availableDays'
  | 'auth.volunteer.availableTime'
  | 'auth.volunteer.morning'
  | 'auth.volunteer.afternoon'
  | 'auth.volunteer.night'
  | 'auth.volunteer.errorAddress';

export const authEn: Record<AuthKey, string> = {
  'auth.login.title': 'Login',
  'auth.login.subtitle': 'Sign in to continue',
  'auth.login.phonePlaceholder': 'Enter Your Mobile Number',
  'auth.login.passwordPlaceholder': 'Enter Your Password',
  'auth.login.rememberMe': 'Remember me',
  'auth.login.forgotPassword': 'Forgot Password?',
  'auth.login.noAccount': 'Don\'t have an account?',
  'auth.login.signUp': 'Sign Up',
  'auth.login.btn': 'Login',
  'auth.login.errorEmpty': 'Please fill in all fields.',
  'auth.login.errorFailed': 'Login failed.',
  'auth.register.title': 'Sign Up',
  'auth.register.subtitle': 'Create your account',
  'auth.register.fullNamePlaceholder': 'Full Name',
  'auth.register.phonePlaceholder': 'Mobile Number',
  'auth.register.passwordPlaceholder': 'Password',
  'auth.register.confirmPlaceholder': 'Confirm Password',
  'auth.register.btn': 'Next',
  'auth.register.haveAccount': 'Already have an account?',
  'auth.register.loginLink': 'Login',
  'auth.register.errorEmpty': 'Please fill in all fields.',
  'auth.register.errorPasswordMatch': 'Passwords do not match.',
  'auth.register.errorPasswordLength': 'Password must be at least 6 characters.',
  'auth.register.errorFailed': 'Registration failed.',
  'auth.otp.title': 'Enter OTP',
  'auth.otp.sentTo': 'Your OTP sent to',
  'auth.otp.resendIn': 'Resend code in',
  'auth.otp.verify': 'Verify OTP',
  'auth.otp.noCode': 'Didn\'t receive code?',
  'auth.otp.errorLength': 'Please enter 4 digits.',
  'auth.otp.errorInvalid': 'Invalid OTP.',
  'auth.otp.errorResend': 'Cannot resend OTP.',
  'auth.forgot.title': 'Forgot password?',
  'auth.forgot.subtitle': 'Enter your mobile number or email to receive an OTP.',
  'auth.forgot.placeholder': 'Enter your Mobile number or Email ID',
  'auth.forgot.sendOtp': 'Send OTP',
  'auth.forgot.backToLogin': '← Back to Login',
  'auth.forgot.errorEmpty': 'Please enter phone number or email.',
  'auth.forgot.errorNotFound': 'Account not found.',
  'auth.reset.title': 'Reset Password',
  'auth.reset.subtitle': 'Enter your new password below.',
  'auth.reset.newPassword': 'Enter new password',
  'auth.reset.confirmPassword': 'Confirm password',
  'auth.reset.confirm': 'Confirm',
  'auth.reset.successTitle': 'Awesome!',
  'auth.reset.successMsg': 'Your password has been changed successfully.',
  'auth.reset.backToLogin': 'Back to Login',
  'auth.reset.errorEmpty': 'Please fill in all fields.',
  'auth.reset.errorLength': 'Password must be at least 6 characters.',
  'auth.reset.errorMatch': 'Passwords do not match.',
  'auth.reset.errorFailed': 'Password reset failed.',
  'auth.confirm.defaultErrorTitle': 'Something went wrong!',
  'auth.confirm.defaultSuccessTitle': 'Success!',
  'auth.confirm.defaultErrorMsg': 'Please try again.',
  'auth.confirm.defaultSuccessMsg': 'Operation completed successfully.',
  'auth.confirm.tryAgain': 'Try Again',
  'auth.role.title': 'Want to share food?',
  'auth.role.subtitle': 'Choose your role',
  'auth.role.donorLabel': 'Donor',
  'auth.role.donorDesc': 'Donate some food to the needful',
  'auth.role.receiverLabel': 'Receiver',
  'auth.role.receiverDesc': 'Receive donated food from donors nearby',
  'auth.role.volunteerLabel': 'Volunteer',
  'auth.role.volunteerDesc': 'Pick up and deliver food to the needful',
  'auth.role.continue': 'Continue',
  'auth.role.errorSelect': 'Please select a role.',
  'auth.details.orgName': 'Organization Name',
  'auth.details.orgNamePlaceholder': 'Enter organization name',
  'auth.details.contactName': 'Contact Name (optional)',
  'auth.details.contactNamePlaceholder': 'Enter contact person name',
  'auth.details.email': 'Email',
  'auth.details.addressLine': 'Address Line',
  'auth.details.addressLinePlaceholder': 'Street, building, neighborhood',
  'auth.details.city': 'City',
  'auth.details.cityPlaceholder': 'Enter your city',
  'auth.details.or': 'Or',
  'auth.details.pinLocation': 'Pin Location by map',
  'auth.details.locationPinned': 'Location pinned — you can still edit above',
  'auth.details.editManually': 'Edit manually',
  'auth.details.submit': 'Submit',
  'auth.details.errorOrgName': 'Please enter organization name.',
  'auth.details.errorAddress': 'Please enter full address.',
  'auth.details.errorGeneric': 'Something went wrong.',
  'auth.donor.title': 'Donor Details',
  'auth.donor.subtitle': 'Help us know more about your donations',
  'auth.donor.type': 'Donor Type',
  'auth.donor.restaurant': 'Restaurant',
  'auth.donor.bakery': 'Bakery',
  'auth.donor.individual': 'Individual',
  'auth.receiver.title': 'Receiver Details',
  'auth.receiver.subtitle': 'Tell us about who you are',
  'auth.receiver.type': 'Receiver Type',
  'auth.receiver.individual': 'Individual',
  'auth.receiver.ngo': 'NGO',
  'auth.receiver.orphanage': 'Orphanage',
  'auth.receiver.shelter': 'Shelter',
  'auth.volunteer.title': 'Volunteer Details',
  'auth.volunteer.subtitle': 'Tell us more so we can match you with deliveries',
  'auth.volunteer.fullName': 'Full Name',
  'auth.volunteer.fullNamePlaceholder': 'Enter your full name',
  'auth.volunteer.vehicleType': 'Vehicle Type (optional)',
  'auth.volunteer.vehiclePlaceholder': 'e.g. Bicycle, Motorbike, Car',
  'auth.volunteer.vehicleLicense': 'Vehicle License Plate (optional)',
  'auth.volunteer.licensePlaceholder': 'e.g. 51A-12345',
  'auth.volunteer.availableDays': 'Available Days',
  'auth.volunteer.availableTime': 'Available Time',
  'auth.volunteer.morning': 'MORNING',
  'auth.volunteer.afternoon': 'AFTERNOON',
  'auth.volunteer.night': 'NIGHT',
  'auth.volunteer.errorAddress': 'Please enter address.',
};

export const authVi: Record<AuthKey, string> = {
  'auth.login.title': 'Đăng nhập',
  'auth.login.subtitle': 'Đăng nhập để tiếp tục',
  'auth.login.phonePlaceholder': 'Nhập số điện thoại',
  'auth.login.passwordPlaceholder': 'Nhập mật khẩu',
  'auth.login.rememberMe': 'Ghi nhớ đăng nhập',
  'auth.login.forgotPassword': 'Quên mật khẩu?',
  'auth.login.noAccount': 'Chưa có tài khoản?',
  'auth.login.signUp': 'Đăng ký',
  'auth.login.btn': 'Đăng nhập',
  'auth.login.errorEmpty': 'Vui lòng nhập đầy đủ thông tin.',
  'auth.login.errorFailed': 'Đăng nhập thất bại.',
  'auth.register.title': 'Đăng ký',
  'auth.register.subtitle': 'Tạo tài khoản mới',
  'auth.register.fullNamePlaceholder': 'Họ và tên',
  'auth.register.phonePlaceholder': 'Số điện thoại',
  'auth.register.passwordPlaceholder': 'Mật khẩu',
  'auth.register.confirmPlaceholder': 'Xác nhận mật khẩu',
  'auth.register.btn': 'Tiếp theo',
  'auth.register.haveAccount': 'Đã có tài khoản?',
  'auth.register.loginLink': 'Đăng nhập',
  'auth.register.errorEmpty': 'Vui lòng điền đầy đủ thông tin.',
  'auth.register.errorPasswordMatch': 'Mật khẩu xác nhận không khớp.',
  'auth.register.errorPasswordLength': 'Mật khẩu phải có ít nhất 6 ký tự.',
  'auth.register.errorFailed': 'Đăng ký thất bại.',
  'auth.otp.title': 'Nhập mã OTP',
  'auth.otp.sentTo': 'OTP đã được gửi đến',
  'auth.otp.resendIn': 'Gửi lại sau',
  'auth.otp.verify': 'Xác nhận OTP',
  'auth.otp.noCode': 'Chưa nhận được mã?',
  'auth.otp.errorLength': 'Vui lòng nhập đủ 4 chữ số.',
  'auth.otp.errorInvalid': 'OTP không hợp lệ.',
  'auth.otp.errorResend': 'Không thể gửi lại OTP.',
  'auth.forgot.title': 'Quên mật khẩu?',
  'auth.forgot.subtitle': 'Nhập số điện thoại hoặc email để nhận mã OTP.',
  'auth.forgot.placeholder': 'Nhập số điện thoại hoặc email',
  'auth.forgot.sendOtp': 'Gửi OTP',
  'auth.forgot.backToLogin': '← Quay lại đăng nhập',
  'auth.forgot.errorEmpty': 'Vui lòng nhập số điện thoại hoặc email.',
  'auth.forgot.errorNotFound': 'Không tìm thấy tài khoản.',
  'auth.reset.title': 'Đặt lại mật khẩu',
  'auth.reset.subtitle': 'Nhập mật khẩu mới của bạn.',
  'auth.reset.newPassword': 'Nhập mật khẩu mới',
  'auth.reset.confirmPassword': 'Xác nhận mật khẩu',
  'auth.reset.confirm': 'Xác nhận',
  'auth.reset.successTitle': 'Tuyệt vời!',
  'auth.reset.successMsg': 'Mật khẩu của bạn đã được thay đổi thành công.',
  'auth.reset.backToLogin': 'Quay lại đăng nhập',
  'auth.reset.errorEmpty': 'Vui lòng điền đầy đủ.',
  'auth.reset.errorLength': 'Mật khẩu phải có ít nhất 6 ký tự.',
  'auth.reset.errorMatch': 'Mật khẩu xác nhận không khớp.',
  'auth.reset.errorFailed': 'Đặt lại mật khẩu thất bại.',
  'auth.confirm.defaultErrorTitle': 'Đã có lỗi xảy ra!',
  'auth.confirm.defaultSuccessTitle': 'Thành công!',
  'auth.confirm.defaultErrorMsg': 'Vui lòng thử lại.',
  'auth.confirm.defaultSuccessMsg': 'Thao tác hoàn thành thành công.',
  'auth.confirm.tryAgain': 'Thử lại',
  'auth.role.title': 'Bạn muốn chia sẻ thực phẩm?',
  'auth.role.subtitle': 'Chọn vai trò của bạn',
  'auth.role.donorLabel': 'Người tặng',
  'auth.role.donorDesc': 'Tặng thực phẩm cho người cần',
  'auth.role.receiverLabel': 'Người nhận',
  'auth.role.receiverDesc': 'Nhận thực phẩm quyên góp từ người tặng gần bạn',
  'auth.role.volunteerLabel': 'Tình nguyện viên',
  'auth.role.volunteerDesc': 'Lấy và giao thực phẩm cho người cần',
  'auth.role.continue': 'Tiếp tục',
  'auth.role.errorSelect': 'Vui lòng chọn một vai trò.',
  'auth.details.orgName': 'Tên tổ chức',
  'auth.details.orgNamePlaceholder': 'Nhập tên tổ chức',
  'auth.details.contactName': 'Tên liên hệ (tùy chọn)',
  'auth.details.contactNamePlaceholder': 'Nhập tên người liên hệ',
  'auth.details.email': 'Email',
  'auth.details.addressLine': 'Địa chỉ',
  'auth.details.addressLinePlaceholder': 'Đường, tòa nhà, khu vực',
  'auth.details.city': 'Thành phố',
  'auth.details.cityPlaceholder': 'Nhập thành phố của bạn',
  'auth.details.or': 'Hoặc',
  'auth.details.pinLocation': 'Chọn vị trí trên bản đồ',
  'auth.details.locationPinned': 'Đã chọn vị trí — bạn vẫn có thể chỉnh sửa bên trên',
  'auth.details.editManually': 'Chỉnh sửa thủ công',
  'auth.details.submit': 'Gửi',
  'auth.details.errorOrgName': 'Vui lòng nhập tên tổ chức.',
  'auth.details.errorAddress': 'Vui lòng nhập địa chỉ đầy đủ.',
  'auth.details.errorGeneric': 'Có lỗi xảy ra.',
  'auth.donor.title': 'Thông tin người tặng',
  'auth.donor.subtitle': 'Giúp chúng tôi biết thêm về các đóng góp của bạn',
  'auth.donor.type': 'Loại người tặng',
  'auth.donor.restaurant': 'Nhà hàng',
  'auth.donor.bakery': 'Tiệm bánh',
  'auth.donor.individual': 'Cá nhân',
  'auth.receiver.title': 'Thông tin người nhận',
  'auth.receiver.subtitle': 'Hãy cho chúng tôi biết bạn là ai',
  'auth.receiver.type': 'Loại người nhận',
  'auth.receiver.individual': 'Cá nhân',
  'auth.receiver.ngo': 'Tổ chức phi lợi nhuận',
  'auth.receiver.orphanage': 'Cô nhi viện',
  'auth.receiver.shelter': 'Nhà tạm trú',
  'auth.volunteer.title': 'Thông tin tình nguyện viên',
  'auth.volunteer.subtitle': 'Cho chúng tôi biết thêm để ghép bạn với các đơn giao hàng',
  'auth.volunteer.fullName': 'Họ và tên',
  'auth.volunteer.fullNamePlaceholder': 'Nhập họ và tên của bạn',
  'auth.volunteer.vehicleType': 'Loại phương tiện (tùy chọn)',
  'auth.volunteer.vehiclePlaceholder': 'VD: Xe đạp, Xe máy, Ô tô',
  'auth.volunteer.vehicleLicense': 'Biển số xe (tùy chọn)',
  'auth.volunteer.licensePlaceholder': 'VD: 51A-12345',
  'auth.volunteer.availableDays': 'Ngày có thể làm',
  'auth.volunteer.availableTime': 'Thời gian có thể làm',
  'auth.volunteer.morning': 'BUỔI SÁNG',
  'auth.volunteer.afternoon': 'BUỔI CHIỀU',
  'auth.volunteer.night': 'BUỔI TỐI',
  'auth.volunteer.errorAddress': 'Vui lòng nhập địa chỉ.',
};
