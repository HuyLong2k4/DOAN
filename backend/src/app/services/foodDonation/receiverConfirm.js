const FoodDonation = require('../../models/foodDonationModel');
const Delivery = require('../../models/deliveryModel');
const User = require('../../models/userModel');
const NotificationService = require('../notificationService');
const { archiveDonationConversations } = require('./archiveConversations');

const DONOR_COMPLETION_POINTS = 100;
const VOLUNTEER_DELIVERY_POINTS = 100;

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

async function _awardPoints(userId, amount) {
    if (!userId || !amount) return 0;
    await User.findByIdAndUpdate(userId, { $inc: { points: amount } });
    return amount;
}

/**
 * Receiver xác nhận đã nhận hàng → finalize đơn.
 * Có thể được gọi từ:
 *   - Endpoint receiver bấm xác nhận
 *   - Cron auto-confirm sau timeout
 */
async function finalizeDelivery(donation, delivery, { auto = false } = {}) {
    // Atomic transition: chỉ chuyển từ AWAITING_CONFIRMATION → DELIVERED.
    // Cũng chấp nhận ON_THE_WAY để tương thích ngược với delivery cũ chưa qua bước AWAITING.
    const deliveryUpdate = await Delivery.updateOne(
        {
            _id: delivery._id,
            status: { $in: ['AWAITING_CONFIRMATION', 'ON_THE_WAY'] },
        },
        { $set: { status: 'DELIVERED', delivered_at: new Date() } },
    );

    if (deliveryUpdate.modifiedCount === 0) {
        return {
            already_completed: true,
            points_awarded_to_donor: 0,
            points_awarded_to_volunteer: 0,
        };
    }

    const donationUpdate = await FoodDonation.updateOne(
        { _id: donation._id, status: { $ne: 'COMPLETED' } },
        { $set: { status: 'COMPLETED' } },
    );

    const pointsAwardedToDonor = donationUpdate.modifiedCount > 0
        ? await _awardPoints(donation.donor_id, DONOR_COMPLETION_POINTS)
        : 0;
    const pointsAwardedToVolunteer = donationUpdate.modifiedCount > 0
        ? await _awardPoints(delivery.volunteer_id, VOLUNTEER_DELIVERY_POINTS)
        : 0;

    // Notify donor + volunteer
    const targets = [String(donation.donor_id)];
    if (delivery.volunteer_id) targets.push(String(delivery.volunteer_id));

    await NotificationService.dispatch({
        userIds: targets,
        key: auto ? 'delivery.confirmed.auto' : 'delivery.confirmed.manual',
        params: { title: donation.title },
        type: 'DELIVERY_CONFIRMED',
        data: { donation_id: donation._id.toString(), auto: auto ? '1' : '0' },
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

    await archiveDonationConversations(donation._id);

    return {
        already_completed: false,
        points_awarded_to_donor: pointsAwardedToDonor,
        points_awarded_to_volunteer: pointsAwardedToVolunteer,
    };
}

/**
 * PATCH /api/food-donations/:id/confirm-received  (RECEIVER only)
 */
async function confirmDeliveryReceived(donationId, receiverId) {
    const donation = await FoodDonation.findById(donationId).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
        throw _error('Bạn không có quyền xác nhận đơn này.', 403);
    }

    if (donation.delivery_type !== 'VIA_AGENT' || !donation.delivery_id) {
        throw _error('Đơn này không ở chế độ uỷ thác volunteer.', 400);
    }

    const delivery = await Delivery.findById(donation.delivery_id).lean();
    if (!delivery) throw _error('Không tìm thấy delivery của đơn này.', 404);

    if (delivery.status === 'DELIVERED') {
        return { message: 'Đơn đã được xác nhận trước đó.', already_completed: true };
    }

    if (delivery.status !== 'AWAITING_CONFIRMATION') {
        throw _error('Volunteer chưa báo đã giao xong. Chưa thể xác nhận.', 400);
    }

    const result = await finalizeDelivery(donation, delivery, { auto: false });
    return {
        message: result.already_completed
            ? 'Đơn đã được xác nhận trước đó.'
            : 'Đã xác nhận đơn. Cảm ơn bạn!',
        ...result,
    };
}

/**
 * Cron: auto-confirm các delivery đã ở AWAITING_CONFIRMATION quá X giờ.
 */
async function autoConfirmStaleDeliveries(timeoutHours = 24) {
    const threshold = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

    const stale = await Delivery.find({
        status: 'AWAITING_CONFIRMATION',
        updatedAt: { $lt: threshold },
    })
        .select('_id donation_id volunteer_id status')
        .lean();

    if (stale.length === 0) return { confirmed_count: 0 };

    let confirmedCount = 0;
    for (const delivery of stale) {
        const donation = await FoodDonation.findById(delivery.donation_id).lean();
        if (!donation) continue;
        const result = await finalizeDelivery(donation, delivery, { auto: true });
        if (!result.already_completed) confirmedCount += 1;
    }

    return { confirmed_count: confirmedCount };
}

module.exports = {
    confirmDeliveryReceived,
    autoConfirmStaleDeliveries,
    finalizeDelivery,
    DONOR_COMPLETION_POINTS,
    VOLUNTEER_DELIVERY_POINTS,
};
