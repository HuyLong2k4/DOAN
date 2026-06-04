/**
 * Volunteer actions: accept / reject / release / pickup-start / mark-delivered.
 *
 * Lưu ý: completeDeliveryByVolunteer không set DELIVERED ngay, mà set
 * AWAITING_CONFIRMATION; receiver phải confirm-received để hoàn tất + cộng điểm.
 */

const FoodDonation = require('../../models/foodDonationModel');
const Delivery = require('../../models/deliveryModel');
const User = require('../../models/userModel');
const NotificationService = require('../notificationService');
const pickupCodeUtil = require('./pickupCode');

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

// ── PATCH /api/food-donations/:id/accept ────────────────────────────────────
// Auto-match: bất kỳ volunteer nào cũng có thể accept. Ai accept trước (atomic
// findOneAndUpdate guard bằng status: PENDING) thắng.
async function acceptDonationByVolunteer(donationId, volunteerId) {
    const donation = await FoodDonation.findOne({ _id: donationId, status: 'PENDING' }).lean();
    if (!donation) {
        throw _error('Đơn không tồn tại hoặc đã được nhận.', 404);
    }

    if (donation.delivery_type !== 'VIA_AGENT' || !donation.delivery_id) {
        throw _error('Đơn này chưa chọn hình thức uỷ thác volunteer.');
    }

    const delivery = await Delivery.findById(donation.delivery_id)
        .select('status')
        .lean();

    if (!delivery) {
        throw _error('Không tìm thấy delivery của đơn này.', 404);
    }

    const updated = await FoodDonation.findOneAndUpdate(
        { _id: donationId, status: 'PENDING' },
        { status: 'ACCEPTED', volunteer_id: volunteerId },
        { new: true },
    );

    if (!updated) {
        throw _error('Đơn không tồn tại hoặc đã được nhận.', 404);
    }

    await Delivery.updateOne(
        { _id: donation.delivery_id },
        {
            $set: {
                volunteer_id: volunteerId,
                status: 'AGENT_ASSIGNED',
                assigned_at: new Date(),
            },
        },
    );

    return updated;
}

// ── PATCH /api/food-donations/:id/reject ────────────────────────────────────
async function rejectDonationByVolunteer(donationId, volunteerId) {
    const updated = await FoodDonation.findOneAndUpdate(
        { _id: donationId, status: 'PENDING' },
        { $addToSet: { rejected_by: volunteerId } },
        { new: true },
    );

    if (!updated) {
        throw _error('Đơn không tồn tại hoặc không còn khả dụng.', 404);
    }

    // rejected_by giúp `getDonations` ẩn đơn này khỏi list của volunteer hiện tại.
    return updated;
}

// ── PATCH /api/food-donations/:id/release ───────────────────────────────────
// Volunteer trả lại đơn đã accept (trước khi pickup).
async function releaseDonationByVolunteer(donationId, volunteerId) {
    const donation = await FoodDonation.findOne({
        _id: donationId,
        volunteer_id: volunteerId,
        delivery_type: 'VIA_AGENT',
        status: 'ACCEPTED',
    }).lean();

    if (!donation) {
        throw _error('Không tìm thấy đơn đã được bạn nhận.', 404);
    }
    if (!donation.delivery_id) {
        throw _error('Đơn này chưa có delivery.', 400);
    }

    const delivery = await Delivery.findById(donation.delivery_id).lean();
    if (!delivery) throw _error('Không tìm thấy delivery của đơn này.', 404);

    if (delivery.status !== 'AGENT_ASSIGNED') {
        throw _error('Chỉ có thể trả đơn khi chưa bắt đầu giao.', 400);
    }

    const updateResult = await FoodDonation.updateOne(
        { _id: donationId, volunteer_id: volunteerId, status: 'ACCEPTED' },
        {
            $set: { volunteer_id: null, status: 'PENDING' },
            $addToSet: { rejected_by: volunteerId },
        },
    );

    if (updateResult.modifiedCount === 0) {
        throw _error('Đơn đã đổi trạng thái, không thể trả lại.', 409);
    }

    await Delivery.updateOne(
        { _id: donation.delivery_id },
        {
            $set: {
                volunteer_id: null,
                status: 'WAITING_AGENT',
                assigned_at: null,
            },
        },
    );

    const targets = [];
    if (donation.selected_receiver_id) targets.push(String(donation.selected_receiver_id));
    targets.push(String(donation.donor_id));

    await NotificationService.dispatch({
        userIds: targets,
        key: 'volunteer.releasedDonation',
        params: { title: donation.title },
        type: 'VOLUNTEER_RELEASED',
        data: { donation_id: donation._id.toString() },
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

    return { message: 'Đã trả lại đơn. Đơn sẽ tìm volunteer khác.' };
}

// ── PATCH /api/food-donations/:id/pickup-start ──────────────────────────────
// Volunteer xác nhận đã lấy hàng — phải nhập đúng pickup_code do donor cung cấp.
async function startPickupByVolunteer(donationId, volunteerId, pickupCode = null) {
    const donation = await FoodDonation.findOne({
        _id: donationId,
        volunteer_id: volunteerId,
        delivery_type: 'VIA_AGENT',
    }).lean();

    if (!donation) {
        throw _error('Không tìm thấy đơn đã được bạn nhận.', 404);
    }

    if (!donation.delivery_id) {
        throw _error('Đơn này chưa có delivery.', 400);
    }

    const delivery = await Delivery.findById(donation.delivery_id).lean();
    if (!delivery) {
        throw _error('Không tìm thấy delivery của đơn này.', 404);
    }

    if (delivery.status === 'ON_THE_WAY') {
        return { message: 'Đơn đã được xác nhận đang giao.', already_started: true };
    }

    if (delivery.status === 'DELIVERED') {
        throw _error('Đơn này đã được giao hoàn tất.', 400);
    }

    if (delivery.status !== 'AGENT_ASSIGNED') {
        throw _error('Đơn chưa ở trạng thái có thể bắt đầu giao.', 400);
    }

    // Verify pickup_code kèm chống brute-force (throw nếu sai/đang khoá).
    await pickupCodeUtil.assertPickupCode(delivery, pickupCode);

    // Atomic: AGENT_ASSIGNED → ON_THE_WAY. Chống double-tap ghi đè picked_up_at.
    const pickupUpdate = await Delivery.updateOne(
        { _id: delivery._id, status: 'AGENT_ASSIGNED' },
        { $set: { status: 'ON_THE_WAY', picked_up_at: new Date() } },
    );
    if (pickupUpdate.modifiedCount === 0) {
        return { message: 'Đơn đã được xác nhận đang giao.', already_started: true };
    }

    await FoodDonation.updateOne(
        { _id: donation._id },
        { $set: { status: 'PICKED_UP' } },
    );

    const volunteer = await User.findById(volunteerId).select('full_name').lean();
    const volunteerName = volunteer?.full_name || 'Volunteer';

    await NotificationService.dispatch({
        userIds: donation.selected_receiver_id,
        key: 'volunteer.pickupStarted',
        params: { volunteerName, title: donation.title },
        type: 'VOLUNTEER_PICKUP_STARTED',
        data: { donation_id: donation._id.toString(), delivery_id: delivery._id.toString() },
        related_entity_type: 'Delivery',
        related_entity_id: delivery._id,
    });

    return { message: 'Đã xác nhận lấy hàng. Đơn đang được giao.', already_started: false };
}

// ── PATCH /api/food-donations/:id/delivered ─────────────────────────────────
// Volunteer báo đã giao xong — set AWAITING_CONFIRMATION (chưa cộng điểm).
// Receiver phải confirm-received hoặc cron auto-confirm sau 24h để hoàn tất.
async function completeDeliveryByVolunteer(donationId, volunteerId) {
    const donation = await FoodDonation.findOne({
        _id: donationId,
        volunteer_id: volunteerId,
        delivery_type: 'VIA_AGENT',
    }).lean();

    if (!donation) {
        throw _error('Không tìm thấy đơn đã được bạn nhận.', 404);
    }

    if (!donation.delivery_id) {
        throw _error('Đơn này chưa có delivery.', 400);
    }

    const delivery = await Delivery.findById(donation.delivery_id).lean();
    if (!delivery) {
        throw _error('Không tìm thấy delivery của đơn này.', 404);
    }

    if (delivery.status === 'DELIVERED') {
        return { message: 'Đơn đã được xác nhận giao hoàn tất trước đó.', already_completed: true };
    }

    if (delivery.status !== 'ON_THE_WAY') {
        throw _error('Bạn cần xác nhận đã lấy hàng trước khi hoàn tất giao hàng.', 400);
    }

    // Atomic: ON_THE_WAY → AWAITING_CONFIRMATION (chống double-complete).
    const deliveryStatusUpdate = await Delivery.updateOne(
        { _id: delivery._id, status: 'ON_THE_WAY' },
        { $set: { status: 'AWAITING_CONFIRMATION' } },
    );

    if (deliveryStatusUpdate.modifiedCount === 0) {
        return {
            message: 'Đơn đã được xác nhận trước đó hoặc trạng thái không hợp lệ.',
            already_completed: true,
            points_awarded_to_donor: 0,
            points_awarded_to_volunteer: 0,
        };
    }

    const volunteer = await User.findById(volunteerId).select('full_name').lean();
    const volunteerName = volunteer?.full_name || 'Volunteer';

    await NotificationService.dispatch({
        userIds: donation.selected_receiver_id,
        key: 'volunteer.delivered',
        params: { volunteerName, title: donation.title },
        type: 'VOLUNTEER_DELIVERY_AWAITING_CONFIRM',
        data: { donation_id: donation._id.toString(), delivery_id: delivery._id.toString() },
        related_entity_type: 'Delivery',
        related_entity_id: delivery._id,
    });

    return {
        message: 'Đã ghi nhận giao hàng. Đợi receiver xác nhận để hoàn tất + nhận điểm.',
        already_completed: false,
        awaiting_receiver_confirmation: true,
        points_awarded_to_donor: 0,
        points_awarded_to_volunteer: 0,
    };
}

module.exports = {
    acceptDonationByVolunteer,
    rejectDonationByVolunteer,
    releaseDonationByVolunteer,
    startPickupByVolunteer,
    completeDeliveryByVolunteer,
};
