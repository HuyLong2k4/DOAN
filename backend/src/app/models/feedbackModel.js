const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    delivery_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true },
    from_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to_user_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // 1 → 5 sao
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
