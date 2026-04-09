const mongoose = require('mongoose');

const DONOR_TYPE = ['RESTAURANT', 'BAKERY', 'INDIVIDUAL'];

const DonorProfileSchema = new mongoose.Schema({
    // Trỏ 1-1 về Users._id
    user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    donor_type:   { type: String, enum: DONOR_TYPE, required: true },

    // Hiển thị khi donor_type là RESTAURANT hoặc BAKERY
    business_name: { type: String, default: null },
    // "Contact Name (Optional)" trong form
    contact_name:  { type: String, default: null },

    address_line:  { type: String, required: true },
    pin_code:      { type: String, default: null },
    city:          { type: String, required: true },
    latitude:      { type: Number, default: null },
    longitude:     { type: Number, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('DonorProfile', DonorProfileSchema);
