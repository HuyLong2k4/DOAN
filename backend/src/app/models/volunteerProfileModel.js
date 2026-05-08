const mongoose = require('mongoose');

const VERIFICATION_STATUS = ['PENDING', 'APPROVED', 'REJECTED'];
const AVAILABILITY_TIME   = ['MORNING', 'AFTERNOON', 'NIGHT', 'OTHER'];
// MORNING: 8-11 | AFTERNOON: 13-15 | NIGHT: 22-23

const VolunteerProfileSchema = new mongoose.Schema({
    user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    contact_name: { type: String, default: null },

    address_line: { type: String, required: true },
    pin_code:     { type: String, default: null },
    city:         { type: String, required: true },
    latitude:     { type: Number, default: null },
    longitude:    { type: Number, default: null },

    // Xác minh danh tính (Aadhar ID, ...)
    verification_document_type: { type: String, default: null },
    verification_document_url:  { type: String, default: null },
    verification_status: {
        type: String,
        enum: VERIFICATION_STATUS,
        default: 'PENDING',
    },
    verified_at: { type: Date, default: null },

    // Lịch rảnh: ["MON","TUE",...] hoặc "ALL_WEEKDAYS" / "ALL_WEEKEND" / "ANY_DAY"
    availability_days: { type: mongoose.Schema.Types.Mixed, default: [] },
    availability_time: { type: String, enum: AVAILABILITY_TIME, default: null },

    // Mục tiêu số đơn volunteer tự đặt — hiển thị trên Home
    delivery_goal: { type: Number, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('VolunteerProfile', VolunteerProfileSchema);
