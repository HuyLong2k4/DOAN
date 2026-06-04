const mongoose = require('mongoose');

const USER_ROLE = ['UNSET', 'DONOR', 'RECEIVER', 'VOLUNTEER', 'ADMIN'];

const UserSchema = new mongoose.Schema({
    phone_number: { type: String, sparse: true, unique: true },
    email:        { type: String, sparse: true, unique: true },

    password:     { type: String, default: null },
    full_name:    { type: String, default: null },
    avatar_url:   { type: String, default: null },

    role: { type: String, enum: USER_ROLE, default: 'UNSET' },
    onboarding_step:   { type: Number, default: 0 },
    profile_completed: { type: Boolean, default: false },

    is_phone_verified: { type: Boolean, default: false },
    is_email_verified: { type: Boolean, default: false },

    points: { type: Number, default: 0 },

    // Expo Push Token (ExponentPushToken[...]). Để rỗng khi user chưa cấp quyền hoặc đã logout.
    push_token: { type: String, default: '' },

    // Ngôn ngữ ưa thích — dùng để render thông báo (in-app + push) đúng ngôn ngữ
    // người nhận. App đồng bộ giá trị này khi đăng ký push-token / khi đổi ngôn ngữ.
    language: { type: String, enum: ['vi', 'en'], default: 'vi' },

    // Tăng mỗi lần logout / đổi mật khẩu để vô hiệu hoá toàn bộ JWT cũ.
    token_version: { type: Number, default: 0 },
    // Cho phép admin khoá tài khoản mà không xoá hẳn dữ liệu.
    is_active: { type: Boolean, default: true },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);