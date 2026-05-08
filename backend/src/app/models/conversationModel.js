const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    pair_key: { type: String, required: true },

    donation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', required: true },
    delivery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', default: null },

    last_message_text: { type: String, default: '' },
    last_message_at: { type: Date, default: null },
    last_sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    is_active: { type: Boolean, default: true },
}, {
    timestamps: true,
});

ConversationSchema.index(
    { donation_id: 1, pair_key: 1 },
    { unique: true, name: 'idx_unique_donation_pair' },
);
ConversationSchema.index(
    { participants: 1, last_message_at: -1, updatedAt: -1 },
    { name: 'idx_participants_last_message' },
);

module.exports = mongoose.model('Conversation', ConversationSchema);
