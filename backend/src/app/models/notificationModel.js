const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // Phân loại thông báo (DELIVERY, DONATION, SYSTEM, ...)
    type: { type: String, default: null },

    // Trỏ đến object liên quan (delivery_id, donation_id, ...)
    related_entity_type: { type: String, default: null },
    related_entity_id:   { type: mongoose.Schema.Types.ObjectId, default: null },

    is_read: { type: Boolean, default: false },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notification', NotificationSchema);
