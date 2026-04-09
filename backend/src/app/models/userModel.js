const mongoose = require('mongoose');

const USER_ROLE      = ['UNSET', 'DONOR', 'RECEIVER', 'VOLUNTEER', 'ADMIN'];
const OAUTH_PROVIDER = ['GOOGLE', 'FACEBOOK'];

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

    oauth_provider: { type: String, enum: OAUTH_PROVIDER },
    oauth_id:       { type: String },

    points: { type: Number, default: 0 },
    earned_badges: [{
        badge_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
        earned_at: { type: Date, default: Date.now }
    }],

    fcm_token: { type: String, default: '' },
}, {
    timestamps: true,
});

UserSchema.index(
    { oauth_provider: 1, oauth_id: 1 },
    { unique: true, sparse: true, name: 'idx_oauth_provider_id' }
);

module.exports = mongoose.model('User', UserSchema);