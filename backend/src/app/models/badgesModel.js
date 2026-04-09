const mongoose = require('mongoose');

const BADGE_TYPE = ['DONOR', 'VOLUNTEER', 'RECEIVER', 'SPECIAL'];
const LABEL = ['ORDERS_COMPLETED', 'FOOD_QUANTITY_KG', 'TIME_OF_DAY', 'STREAK_DAYS'];

const BadgesSchema = new mongoose.Schema({
    name: { type: String, require: true },
    image_url: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/3176/3176294.png'},
    description: { type: String },
    type: { type: String, enum: BADGE_TYPE, required: true },
    is_active: { type: Boolean, default: true },
    // loại điều kiện
    criteria: {
    metric: { type: String, required: true, enum: LABEL },
    threshold: { type: Number, required: true, min: 1 },
    // Ví dụ: metric='ORDERS_COMPLETED', threshold=10 => Đạt 10 đơn thì nhận
  },
}, {
    timestamps: true
});

module.exports = mongoose.model('Badges', BadgesSchema);
