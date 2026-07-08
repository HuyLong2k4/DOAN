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

    language: { type: String, enum: ['vi', 'en'], default: 'vi' },
    
    token_version: { type: Number, default: 0 },

    is_active: { type: Boolean, default: true },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);