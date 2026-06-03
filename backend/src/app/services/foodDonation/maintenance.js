/**
 * Cron tasks chạy định kỳ trong server.js.
 *
 *  - expireOverdueDonations: PENDING quá hạn → EXPIRED
 *  - autoConfirmStaleDeliveries: AWAITING_CONFIRMATION quá 24h → DELIVERED + cộng điểm
 *  - cancelStaleOnTheWayDeliveries: ON_THE_WAY quá X giờ → CANCELLED (volunteer no-show)
 */

const FoodDonation = require('../../models/foodDonationModel');
const FoodRequest = require('../../models/foodRequestModel');
const Delivery = require('../../models/deliveryModel');
const Notification = require('../../models/notificationModel');
const NotificationService = require('../notificationService');
const { autoConfirmStaleDeliveries } = require('./receiverConfirm');
const { archiveDonationConversations } = require('./archiveConversations');

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

    await Promise.all(ids.map((id) => archiveDonationConversations(id)));

    return { expired_count: overdue.length };
}

// ── Cron: hết hạn các đơn SELF_PICKUP bị kẹt ──────────────────────────────
// Receiver chọn tự lấy (donation ACCEPTED, delivery SELF_PICKUP_READY) nhưng
// không bao giờ xác nhận đã lấy → đơn kẹt mãi (expire-cron chỉ bắt PENDING).
// Quá expiration_datetime thì coi như hết hạn: EXPIRED donation + CANCELLED
// delivery, mở lại food request (nếu đơn tạo từ request).
async function expireStaleSelfPickups() {
    const now = new Date();

    const stale = await FoodDonation.find({
        status: 'ACCEPTED',
        delivery_type: 'SELF_PICKUP',
        expiration_datetime: { $lt: now },
    })
        .select('_id donor_id selected_receiver_id title delivery_id')
        .lean();

    if (stale.length === 0) return { expired_count: 0 };

    let expiredCount = 0;
    for (const donation of stale) {
        // Atomic guard.
        const donationUpdate = await FoodDonation.updateOne(
            { _id: donation._id, status: 'ACCEPTED', delivery_type: 'SELF_PICKUP' },
            { $set: { status: 'EXPIRED' } },
        );
        if (donationUpdate.modifiedCount === 0) continue;

        if (donation.delivery_id) {
            await Delivery.updateOne(
                { _id: donation.delivery_id, status: 'SELF_PICKUP_READY' },
                { $set: { status: 'CANCELLED', cancelled_at: now } },
            );
        }

        await FoodRequest.updateOne(
            { linked_donation_id: donation._id },
            { $set: { linked_donation_id: null, status: 'PENDING', accepted_by_donor_id: null } },
        );

        const targets = [String(donation.donor_id)];
        if (donation.selected_receiver_id) targets.push(String(donation.selected_receiver_id));

        await Notification.insertMany(
            targets.map((userId) => ({
                user_id: userId,
                title: 'Don tu lay da het han',
                message: `Don "${donation.title}" het han do chua duoc lay trong thoi gian quy dinh.`,
                type: 'DONATION_EXPIRED',
                related_entity_type: 'FoodDonation',
                related_entity_id: donation._id,
            })),
        ).catch(() => {});

        await NotificationService.sendToMultipleUsers(targets, {
            title: 'Don da het han',
            body: `Don "${donation.title}" het han do chua duoc lay.`,
            data: { type: 'DONATION_EXPIRED', donation_id: String(donation._id) },
        }).catch(() => {});

        await archiveDonationConversations(donation._id);
        expiredCount += 1;
    }

    return { expired_count: expiredCount };
}

// ── Cron: cancel các delivery đã ở ON_THE_WAY quá X giờ ────────────────────
// Khi volunteer pickup-start nhưng không bao giờ markDelivered, đơn kẹt ở
// ON_THE_WAY vĩnh viễn. Sau timeout, coi như volunteer no-show → cancel cả
// delivery lẫn donation, notify các bên.
async function cancelStaleOnTheWayDeliveries(timeoutHours = 6) {
    const threshold = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

    const stale = await Delivery.find({
        status: 'ON_THE_WAY',
        picked_up_at: { $lt: threshold },
    })
        .select('_id donation_id volunteer_id picked_up_at')
        .lean();

    if (stale.length === 0) return { cancelled_count: 0 };

    let cancelledCount = 0;
    for (const delivery of stale) {
        const donation = await FoodDonation.findById(delivery.donation_id)
            .select('_id donor_id title status')
            .lean();
        if (!donation) continue;

        // Atomic guard.
        const deliveryUpdate = await Delivery.updateOne(
            { _id: delivery._id, status: 'ON_THE_WAY' },
            { $set: { status: 'CANCELLED', cancelled_at: new Date() } },
        );
        if (deliveryUpdate.modifiedCount === 0) continue;

        await FoodDonation.updateOne(
            { _id: donation._id, status: { $nin: ['COMPLETED', 'EXPIRED', 'CANCELLED'] } },
            { $set: { status: 'CANCELLED' } },
        );

        const targets = [String(donation.donor_id)];
        if (delivery.volunteer_id) targets.push(String(delivery.volunteer_id));

        await Notification.insertMany(
            targets.map((userId) => ({
                user_id: userId,
                title: 'Don bi huy do qua thoi gian giao',
                message: `Don "${donation.title}" da bi huy do volunteer khong giao trong ${timeoutHours}h.`,
                type: 'DELIVERY_AUTO_CANCELLED_NO_SHOW',
                related_entity_type: 'FoodDonation',
                related_entity_id: donation._id,
            })),
        ).catch(() => {});

        await NotificationService.sendToMultipleUsers(targets, {
            title: 'Don da bi huy',
            body: `Don "${donation.title}" qua ${timeoutHours}h chua giao, da auto-huy.`,
            data: {
                type: 'DELIVERY_AUTO_CANCELLED_NO_SHOW',
                donation_id: String(donation._id),
                delivery_id: String(delivery._id),
            },
        }).catch(() => {});

        await archiveDonationConversations(donation._id);
        cancelledCount += 1;
    }

    return { cancelled_count: cancelledCount };
}

module.exports = {
    expireOverdueDonations,
    expireStaleSelfPickups,
    autoConfirmStaleDeliveries,
    cancelStaleOnTheWayDeliveries,
};
