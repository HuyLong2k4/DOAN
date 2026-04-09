const mongoose = require('mongoose');

const RECEIVER_TYPE = ['TRUST', 'NGO', 'INDIVIDUAL', 'ORPHANAGE', 'SHELTER'];

const ReceiverProfileSchema = new mongoose.Schema({
    user_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    receiver_type: { type: String, enum: RECEIVER_TYPE, required: true },
    organization_name: { type: String, default: null },
    contact_name:  { type: String, default: null },

    address_line:  { type: String, required: true },
    pin_code:      { type: String, default: null },
    city:          { type: String, required: true },
    latitude:      { type: Number, default: null },
    longitude:     { type: Number, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('ReceiverProfile', ReceiverProfileSchema);
