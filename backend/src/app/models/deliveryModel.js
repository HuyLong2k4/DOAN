const mongoose = require('mongoose');

const DELIVERY_TYPE   = ['VIA_AGENT', 'SELF_PICKUP'];
const DELIVERY_STATUS = ['WAITING_AGENT', 'SELF_PICKUP_READY', 'AGENT_ASSIGNED', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];

const DeliverySchema = new mongoose.Schema({
    // Chỉ 1 trong 2 field donation_id / request_id có giá trị
    donation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', default: null },
    request_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRequest',  default: null },

    donor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    preferred_volunteer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    delivery_type: { type: String, enum: DELIVERY_TYPE, required: true },
    status:        { type: String, enum: DELIVERY_STATUS, default: 'WAITING_AGENT' },

    // Mã lấy hàng — volunteer dùng để xác nhận với donor
    pickup_code: { type: String, default: null },

    assigned_at:  { type: Date, default: null },
    picked_up_at: { type: Date, default: null },
    delivered_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Delivery', DeliverySchema);
