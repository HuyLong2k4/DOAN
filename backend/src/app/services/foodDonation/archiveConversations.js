/**
 * Helper: archive (set is_active=false) toàn bộ conversation gắn với 1 donation
 * khi donation kết thúc (CANCELLED / EXPIRED / COMPLETED / receiver bị release).
 *
 * Conversation vẫn còn trong DB (lịch sử chat) nhưng không hiện trong chat list
 * — chatService query filter `is_active: true`.
 */

const Conversation = require('../../models/conversationModel');

async function archiveDonationConversations(donationId) {
    if (!donationId) return;
    await Conversation.updateMany(
        { donation_id: donationId, is_active: true },
        { $set: { is_active: false } },
    ).catch(() => {});
}

module.exports = {
    archiveDonationConversations,
};
