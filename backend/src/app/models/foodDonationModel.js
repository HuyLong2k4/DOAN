const mongoose = require('mongoose');

const FOOD_TYPE       = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];
const STORAGE_CONDITION = ['ROOM', 'COOL', 'FROZEN'];
const DONATION_STATUS = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'COMPLETED', 'EXPIRED', 'CANCELLED'];

// Lý do huỷ — chỉ có giá trị khi status = CANCELLED.
const CANCEL_REASON = [
    'DONOR_CANCELLED',        // Donor tự huỷ đơn khi đang chờ
    'DONOR_RELEASED',         // Donor giải phóng receiver sau 30' chưa lấy (đơn từ food request)
    'RECEIVER_DISCONNECTED',  // Receiver tự rút khỏi đơn (đơn từ food request)
    'VOLUNTEER_NO_SHOW',      // Receiver báo volunteer đã lấy hàng nhưng không giao đến
    'AUTO_NO_SHOW',           // Cron tự huỷ khi delivery kẹt ON_THE_WAY quá lâu
    'ADMIN_REMOVED',          // Quản trị viên gỡ đơn khi xử lý báo cáo vi phạm
];

const FoodDonationSchema = new mongoose.Schema({
    donor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    source_donation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', default: null },
    volunteer_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    selected_receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    selected_at: { type: Date, default: null },
    receiver_claim_history: [{
        _id: false,
        receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        claimed_at: { type: Date, required: true },
    }],
    delivery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },
    delivery_type: { type: String, default: null },

    title:       { type: String, required: true },
    description: { type: String, default: null },

    food_type:       { type: String, enum: FOOD_TYPE, required: true },
    storage_condition: { type: String, enum: STORAGE_CONDITION, default: 'ROOM' },

    quantity: { type: Number, required: true, min: 1 },
    unit:     { type: String, default: 'portion' },

    images: [{ type: String }],

    expiration_datetime: { type: Date, required: true },

    status: { type: String, enum: DONATION_STATUS, default: 'PENDING' },
    rejected_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    cancel_reason: { type: String, enum: [...CANCEL_REASON, null], default: null },
    cancelled_at:  { type: Date, default: null },
}, {
    timestamps: true,
});

// Feed của receiver/volunteer lọc theo status rồi sắp theo thời gian đăng mới nhất
FoodDonationSchema.index(
    { status: 1, createdAt: -1 },
    { name: 'idx_status_created_at' },
);
// Cron dọn đơn quá hạn quét status='PENDING' kèm expiration_datetime < now
FoodDonationSchema.index(
    { status: 1, expiration_datetime: 1 },
    { name: 'idx_status_expiration' },
);
// Danh sách đơn của một donor, sắp theo thời gian đăng (queries.js: getDonorDonations).
FoodDonationSchema.index(
    { donor_id: 1, createdAt: -1 },
    { name: 'idx_donor_created_at' },
);
// Lịch sử receiver từng nhận đơn, dùng để giới hạn số lần nhận trong một cửa sổ thời gian.
FoodDonationSchema.index(
    { 'receiver_claim_history.receiver_id': 1, 'receiver_claim_history.claimed_at': 1 },
    { name: 'idx_receiver_claim_history' },
);

module.exports = mongoose.model('FoodDonation', FoodDonationSchema);
