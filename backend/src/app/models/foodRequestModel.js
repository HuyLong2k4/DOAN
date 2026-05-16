const mongoose = require('mongoose');

const FOOD_TYPE = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];
const REQUEST_STATUS  = ['PENDING', 'ACCEPTED', 'FULFILLED', 'CANCELLED'];

const FoodRequestSchema = new mongoose.Schema({
    receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title:       { type: String, required: true },
    description: { type: String, default: null },

    requested_quantity: { type: Number, required: true, min: 1 },
    unit:               { type: String, default: 'portion' },
    food_type:          { type: String, enum: FOOD_TYPE, default: 'COOKED' },

    needed_before: { type: Date, default: null },
    accepted_by_donor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    linked_donation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', default: null },
    status:        { type: String, enum: REQUEST_STATUS, default: 'PENDING' },
}, {
    timestamps: true,
});

module.exports = mongoose.model('FoodRequest', FoodRequestSchema);
