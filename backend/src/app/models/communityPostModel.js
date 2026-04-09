const mongoose = require('mongoose');

const POST_TYPE = ['COMMUNITY', 'ANNOUNCEMENT'];

const CommunityPostSchema = new mongoose.Schema({
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type:      { type: String, enum: POST_TYPE, default: 'COMMUNITY' },
    title:     { type: String, required: true },
    content:   { type: String, default: null },
    image_url: { type: String, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('CommunityPost', CommunityPostSchema);
