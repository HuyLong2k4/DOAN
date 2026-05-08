/**
 * Donor actions: tạo đơn quyên góp + huỷ đơn (khi PENDING).
 */

const FoodDonation = require('../../models/foodDonationModel');
const FoodRequest = require('../../models/foodRequestModel');
const Delivery = require('../../models/deliveryModel');
const Notification = require('../../models/notificationModel');
const NotificationService = require('../notificationService');

const VALID_FOOD_TYPE = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

// ── POST /api/food-donations ─────────────────────────────────────────────────
async function createDonation(donorId, data) {
    const {
        title, description,
        food_type, food_preference,
        quantity, unit,
        expiration_datetime,
    } = data;

    if (!title)                    throw _error('title là bắt buộc.');
    if (!food_type)                throw _error('food_type là bắt buộc.');
    if (!quantity || quantity < 1) throw _error('quantity phải >= 1.');
    if (!expiration_datetime)      throw _error('expiration_datetime là bắt buộc.');

    if (!VALID_FOOD_TYPE.includes(food_type)) {
        throw _error(`food_type không hợp lệ. Các giá trị hợp lệ: ${VALID_FOOD_TYPE.join(', ')}`);
    }

    const donation = await FoodDonation.create({
        donor_id:           donorId,
        title,
        description:        description || null,
        food_type,
        food_preference:    food_preference || 'BOTH',
        quantity,
        unit:               unit || 'portion',
        expiration_datetime: new Date(expiration_datetime),
    });

    return { message: 'Tạo đơn quyên góp thành công.', donation };
}

// ── PATCH /api/food-donations/:id/cancel ─────────────────────────────────────
// Donor huỷ đơn khi đang PENDING (trước khi receiver/volunteer pickup).
async function cancelDonationByDonor(donationId, donorId) {
    const donation = await FoodDonation.findOne({ _id: donationId, donor_id: donorId }).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    if (donation.status !== 'PENDING') {
        throw _error('Chỉ có thể huỷ đơn khi đang ở trạng thái chờ. Liên hệ hỗ trợ nếu cần huỷ đơn đã được nhận.', 400);
    }

    const result = await FoodDonation.updateOne(
        { _id: donationId, donor_id: donorId, status: 'PENDING' },
        { $set: { status: 'CANCELLED' } },
    );

    if (result.modifiedCount === 0) {
        throw _error('Đơn đã đổi trạng thái, không thể huỷ.', 409);
    }

    if (donation.delivery_id) {
        await Delivery.updateOne(
            {
                _id: donation.delivery_id,
                status: { $in: ['WAITING_AGENT', 'SELF_PICKUP_READY', 'AGENT_ASSIGNED'] },
            },
            { $set: { status: 'CANCELLED', cancelled_at: new Date() } },
        );
    }

    // Nếu donation được tạo từ FoodRequest → trả request về PENDING.
    await FoodRequest.updateOne(
        { linked_donation_id: donationId },
        {
            $set: {
                linked_donation_id: null,
                status: 'PENDING',
                accepted_by_donor_id: null,
            },
        },
    );

    const targets = [];
    if (donation.selected_receiver_id) targets.push(String(donation.selected_receiver_id));
    if (donation.volunteer_id) targets.push(String(donation.volunteer_id));

    if (targets.length > 0) {
        await Notification.insertMany(
            targets.map((userId) => ({
                user_id: userId,
                title: 'Donor da huy don',
                message: `Donor da huy don "${donation.title}".`,
                type: 'DONATION_CANCELLED',
                related_entity_type: 'FoodDonation',
                related_entity_id: donation._id,
            })),
        ).catch(() => {});

        await NotificationService.sendToMultipleUsers(targets, {
            title: 'Don da bi huy',
            body: `Donor da huy don "${donation.title}".`,
            data: {
                type: 'DONATION_CANCELLED',
                donation_id: donation._id.toString(),
            },
        }).catch(() => {});
    }

    return { message: 'Đã huỷ đơn quyên góp.' };
}

module.exports = {
    createDonation,
    cancelDonationByDonor,
};
