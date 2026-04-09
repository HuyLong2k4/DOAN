const mongoose = require('mongoose');

const OTP_PURPOSE = ['SIGNUP', 'LOGIN', 'RESET_PASSWORD'];

const OtpSessionSchema = new mongoose.Schema({
    phone_number:  { type: String, required: true },
    purpose:       { type: String, enum: OTP_PURPOSE, default: 'SIGNUP' },
    otp_hash:      { type: String, required: true },
    attempt_count: { type: Number, default: 0 },
    expires_at:    { type: Date, required: true },
    used_at:       { type: Date, default: null },
}, {
    timestamps: true,
});

// Tự xóa document sau khi hết hạn (TTL index)
OtpSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpSession', OtpSessionSchema);
