const mongoose = require('mongoose');
const FoodDonation = require('../../models/foodDonationModel');

const MAX_RECEIVER_CLAIMS_PER_WINDOW = 3;
const RECEIVER_CLAIM_WINDOW_MS = 60 * 60 * 1000;

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

function _toObjectId(id) {
    return new mongoose.Types.ObjectId(String(id));
}

async function _getRecentClaimStats(receiverId, now) {
    const receiverObjectId = _toObjectId(receiverId);
    const cutoff = new Date(now.getTime() - RECEIVER_CLAIM_WINDOW_MS);

    const [stats] = await FoodDonation.aggregate([
        {
            $match: {
                receiver_claim_history: {
                    $elemMatch: {
                        receiver_id: receiverObjectId,
                        claimed_at: { $gte: cutoff },
                    },
                },
            },
        },
        { $unwind: '$receiver_claim_history' },
        {
            $match: {
                'receiver_claim_history.receiver_id': receiverObjectId,
                'receiver_claim_history.claimed_at': { $gte: cutoff },
            },
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                oldest: { $min: '$receiver_claim_history.claimed_at' },
            },
        },
    ]);

    return {
        count: stats?.count || 0,
        oldest: stats?.oldest || now,
    };
}

async function assertReceiverClaimLimit(receiverId, now = new Date(), subject = 'Receiver này') {
    const stats = await _getRecentClaimStats(receiverId, now);
    if (stats.count < MAX_RECEIVER_CLAIMS_PER_WINDOW) return;

    const retryAfterMinutes = Math.max(
        1,
        Math.ceil((stats.oldest.getTime() + RECEIVER_CLAIM_WINDOW_MS - now.getTime()) / 60000),
    );

    throw _error(
        `${subject} đã nhận tối đa ${MAX_RECEIVER_CLAIMS_PER_WINDOW} đơn trong 1 giờ. `
        + `Vui lòng thử lại sau khoảng ${retryAfterMinutes} phút.`,
        429,
    );
}

module.exports = {
    MAX_RECEIVER_CLAIMS_PER_WINDOW,
    RECEIVER_CLAIM_WINDOW_MS,
    assertReceiverClaimLimit,
};
