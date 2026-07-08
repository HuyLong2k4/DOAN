const Conversation = require('../../models/conversationModel');

async function archiveDonationConversations(donationId) {
    if (!donationId) return;
    await Conversation.updateMany(
        { donation_id: donationId, is_active: true },
        { $set: { is_active: false } },
    ).catch(() => {});
}

/**
 * Archive chỉ các conversation của 1 donation mà `userId` tham gia. Dùng khi một
 * bên rời đơn nhưng đơn vẫn tiếp tục (vd. volunteer trả đơn) — đóng thread liên
 * quan tới người đó (donor↔volunteer, receiver↔volunteer) nhưng GIỮ donor↔receiver.
 */
async function archiveDonationConversationsForUser(donationId, userId) {
    if (!donationId || !userId) return;
    await Conversation.updateMany(
        { donation_id: donationId, participants: userId, is_active: true },
        { $set: { is_active: false } },
    ).catch(() => {});
}

module.exports = {
    archiveDonationConversations,
    archiveDonationConversationsForUser,
};
