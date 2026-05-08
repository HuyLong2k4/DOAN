/**
 * Cron tasks chạy định kỳ trong server.js.
 *
 *  - expireOverdueDonations: PENDING quá hạn → EXPIRED
 *  - autoConfirmStaleDeliveries: AWAITING_CONFIRMATION quá 24h → DELIVERED + cộng điểm
 */

const FoodDonation = require('../../models/foodDonationModel');
const FoodRequest = require('../../models/foodRequestModel');
const Delivery = require('../../models/deliveryModel');
const Notification = require('../../models/notificationModel');
const { autoConfirmStaleDeliveries } = require('./receiverConfirm');

async function expireOverdueDonations() {
    const now = new Date();

    const overdue = await FoodDonation.find({
        status: 'PENDING',
        expiration_datetime: { $lt: now },
    })
        .select('_id donor_id selected_receiver_id title delivery_id')
        .lean();

    if (overdue.length === 0) return { expired_count: 0 };

    const ids = overdue.map((d) => d._id);
    await FoodDonation.updateMany(
        { _id: { $in: ids }, status: 'PENDING' },
        { $set: { status: 'EXPIRED' } },
    );

    const deliveryIds = overdue.map((d) => d.delivery_id).filter(Boolean);
    if (deliveryIds.length > 0) {
        await Delivery.updateMany(
            {
                _id: { $in: deliveryIds },
                status: { $in: ['WAITING_AGENT', 'SELF_PICKUP_READY', 'AGENT_ASSIGNED'] },
            },
            { $set: { status: 'CANCELLED', cancelled_at: now } },
        );
    }

    await FoodRequest.updateMany(
        { linked_donation_id: { $in: ids } },
        {
            $set: {
                linked_donation_id: null,
                status: 'PENDING',
                accepted_by_donor_id: null,
            },
        },
    );

    const notifications = [];
    for (const donation of overdue) {
        notifications.push({
            user_id: donation.donor_id,
            title: 'Don quyen gop da het han',
            message: `Don "${donation.title}" da het han va chuyen sang trang thai EXPIRED.`,
            type: 'DONATION_EXPIRED',
            related_entity_type: 'FoodDonation',
            related_entity_id: donation._id,
        });
        if (donation.selected_receiver_id) {
            notifications.push({
                user_id: donation.selected_receiver_id,
                title: 'Don da het han',
                message: `Don "${donation.title}" da het han.`,
                type: 'DONATION_EXPIRED',
                related_entity_type: 'FoodDonation',
                related_entity_id: donation._id,
            });
        }
    }
    if (notifications.length > 0) {
        await Notification.insertMany(notifications).catch(() => {});
    }

    return { expired_count: overdue.length };
}

module.exports = {
    expireOverdueDonations,
    autoConfirmStaleDeliveries,
};
