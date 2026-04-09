const mongoose = require('mongoose');

const FOOD_TYPE       = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];
const FOOD_PREFERENCE = ['VEG', 'NON_VEG', 'BOTH'];
const DONATION_STATUS = ['PENDING', 'ACCEPTED', 'PICKED_UP', 'COMPLETED', 'EXPIRED', 'CANCELLED'];
// PENDING   : Đã đăng, chờ ghép cặp Receiver / Volunteer
// ACCEPTED  : Receiver hoặc Volunteer đã nhận đơn, sắp đến lấy
// PICKED_UP : Volunteer đã lấy hàng, đang trên đường giao
// COMPLETED : Thức ăn đến tay người nhận, Donor được cộng điểm
// EXPIRED   : Quá expiration_datetime mà chưa được nhận
// CANCELLED : Donor tự huỷ

const FoodDonationSchema = new mongoose.Schema({
    donor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteer_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    selected_receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    delivery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },
    delivery_type: { type: String, default: null },

    title:       { type: String, required: true },
    description: { type: String, default: null },

    food_type:       { type: String, enum: FOOD_TYPE, required: true },
    food_preference: { type: String, enum: FOOD_PREFERENCE, default: 'BOTH' },

    quantity: { type: Number, required: true, min: 1 },
    unit:     { type: String, default: 'portion' },

    // Danh sách URL ảnh
    images: [{ type: String }],

    available_from:      { type: Date, default: null },
    expiration_datetime: { type: Date, required: true },

    status: { type: String, enum: DONATION_STATUS, default: 'PENDING' },
    interested_receivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rejected_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('FoodDonation', FoodDonationSchema);
