const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    text: { type: String, default: '', trim: true },
    attachments: [{
        url: { type: String, required: true },
        name: { type: String, default: '' },
        mime_type: { type: String, default: 'application/octet-stream' },
        size_bytes: { type: Number, default: 0 },
    }],

    seen_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
    timestamps: true,
});

MessageSchema.index(
    { conversation_id: 1, createdAt: -1 },
    { name: 'idx_conversation_created_at' },
);
MessageSchema.index(
    { conversation_id: 1, sender_id: 1, seen_by: 1 },
    { name: 'idx_unread_lookup' },
);

module.exports = mongoose.model('Message', MessageSchema);
