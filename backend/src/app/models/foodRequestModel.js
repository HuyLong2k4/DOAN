const mongoose = require('mongoose');

const FOOD_PREFERENCE = ['VEG', 'NON_VEG', 'BOTH'];
const REQUEST_STATUS  = ['PENDING', 'ACCEPTED', 'FULFILLED', 'CANCELLED'];

const FoodRequestSchema = new mongoose.Schema({
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title:       { type: String, required: true },
    description: { type: String, default: null },

    requested_quantity: { type: Number, required: true, min: 1 },
    unit:               { type: String, default: 'portion' },
    food_preference:    { type: String, enum: FOOD_PREFERENCE, default: 'BOTH' },

    needed_before: { type: Date, default: null },
    status:        { type: String, enum: REQUEST_STATUS, default: 'PENDING' },
}, {
    timestamps: true,
});

module.exports = mongoose.model('FoodRequest', FoodRequestSchema);
