const mongoose = require('mongoose');

const FOOD_TYPE       = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];
const DONATION_STATUS = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'COMPLETED', 'EXPIRED', 'CANCELLED'];
// PENDING   : Đã đăng, chờ ghép cặp Receiver / Volunteer
// ACCEPTED  : Receiver hoặc Volunteer đã nhận đơn, sắp đến lấy
// PICKED_UP : Volunteer đã lấy hàng, đang trên đường giao
// COMPLETED : Thức ăn đến tay người nhận, Donor được cộng điểm
// EXPIRED   : Quá expiration_datetime mà chưa được nhận
// CANCELLED : Bị huỷ (xem cancel_reason để biết do ai / lý do gì)

// Lý do huỷ — chỉ có giá trị khi status = CANCELLED. Giúp phân biệt no-show với
// huỷ thường và để admin nắm được tình huống tại trang quản lý.
const CANCEL_REASON = [
    'DONOR_CANCELLED',        // Donor tự huỷ đơn khi đang chờ
    'DONOR_RELEASED',         // Donor giải phóng receiver sau 30' chưa lấy (đơn từ food request)
    'RECEIVER_DISCONNECTED',  // Receiver tự rút khỏi đơn (đơn từ food request)
    'VOLUNTEER_NO_SHOW',      // Receiver báo volunteer đã lấy hàng nhưng không giao đến
    'AUTO_NO_SHOW',           // Cron tự huỷ khi delivery kẹt ON_THE_WAY quá lâu
];

const FoodDonationSchema = new mongoose.Schema({
    donor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteer_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    selected_receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Lúc receiver connect (set selected_receiver_id). Dùng làm mốc 30 phút
    // để donor được quyền release receiver nếu chưa pickup.
    selected_at: { type: Date, default: null },
    delivery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },
    delivery_type: { type: String, default: null },

    title:       { type: String, required: true },
    description: { type: String, default: null },

    food_type:       { type: String, enum: FOOD_TYPE, required: true },

    quantity: { type: Number, required: true, min: 1 },
    unit:     { type: String, default: 'portion' },

    // Danh sách URL ảnh
    images: [{ type: String }],

    expiration_datetime: { type: Date, required: true },

    status: { type: String, enum: DONATION_STATUS, default: 'PENDING' },
    rejected_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    cancel_reason: { type: String, enum: [...CANCEL_REASON, null], default: null },
    cancelled_at:  { type: Date, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('FoodDonation', FoodDonationSchema);
