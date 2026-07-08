const mongoose = require('mongoose');

const DELIVERY_TYPE   = ['VIA_AGENT', 'SELF_PICKUP'];
const DELIVERY_STATUS = [
    'WAITING_AGENT',          // VIA_AGENT chưa có volunteer
    'SELF_PICKUP_READY',      // Receiver tự lấy
    'AGENT_ASSIGNED',         // Volunteer đã accept
    'ON_THE_WAY',             // Volunteer đang giao
    'AWAITING_CONFIRMATION',  // Volunteer báo đã giao, chờ receiver xác nhận
    'DELIVERED',              // Hoàn tất
    'CANCELLED',
];

const DeliverySchema = new mongoose.Schema({
    // Chỉ 1 trong 2 field donation_id / request_id có giá trị
    donation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', default: null },
    request_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest',  default: null },

    donor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    delivery_type: { type: String, enum: DELIVERY_TYPE, required: true },
    status:        { type: String, enum: DELIVERY_STATUS, default: 'WAITING_AGENT' },

    pickup_code: { type: String, default: null },
    // Chống brute-force mã pickup: đếm số lần nhập sai + thời điểm hết tạm khoá.
    pickup_attempt_count: { type: Number, default: 0 },
    pickup_locked_until:  { type: Date, default: null },

    assigned_at:  { type: Date, default: null },
    picked_up_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Delivery', DeliverySchema);
