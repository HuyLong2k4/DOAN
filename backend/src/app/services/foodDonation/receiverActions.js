/**
 * Receiver actions: connect donation, chọn delivery type, tự xác nhận khi self-pickup.
 *
 * (Confirm-received cho VIA_AGENT nằm ở `./receiverConfirm.js`.)
 */

const FoodDonation = require('../../models/foodDonationModel');
const Delivery = require('../../models/deliveryModel');
const User = require('../../models/userModel');
const Notification = require('../../models/notificationModel');
const NotificationService = require('../notificationService');
const pickupCodeUtil = require('./pickupCode');
const { awardDonorCompletionPoints } = require('./points');

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

// ── PATCH /api/food-donations/:id/connect ────────────────────────────────────
// Auto-match: receiver bấm connect → tự được chốt (selected_receiver_id).
async function connectDonationByReceiver(donationId, receiverId) {
    const donation = await FoodDonation.findById(donationId)
        .populate('donor_id', 'full_name')
        .lean();

    if (!donation) {
        throw _error('Đơn quyên góp không tồn tại.', 404);
    }

    if (donation.status !== 'PENDING') {
        throw _error('Đơn này không còn khả dụng để connect.');
    }

    if (donation.selected_receiver_id) {
        const selectedId = donation.selected_receiver_id.toString();
        if (selectedId === receiverId.toString()) {
            return {
                message: 'Bạn đã được chốt cho đơn này. Hãy chọn phương thức nhận hàng.',
                already_connected: true,
                auto_approved: true,
            };
        }
        throw _error('Đơn này đã được donor chốt người nhận.');
    }

    const donorId = donation.donor_id?._id?.toString?.() || donation.donor_id?.toString?.();
    if (!donorId) {
        throw _error('Đơn không hợp lệ: thiếu thông tin donor.', 400);
    }

    if (donorId === receiverId.toString()) {
        throw _error('Bạn không thể connect đơn của chính mình.');
    }

    await FoodDonation.updateOne(
        { _id: donationId },
        { $set: { selected_receiver_id: receiverId } },
    );

    const receiver = await User.findById(receiverId).select('full_name').lean();
    const receiverName = receiver?.full_name || 'Một receiver';

    await Notification.create({
        user_id: donorId,
        title: 'Receiver da ket noi don cua ban',
        message: `${receiverName} da ket noi va duoc chot ngay cho don "${donation.title}"`,
        type: 'DONATION_CONNECTED_AUTO',
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

    await Notification.create({
        user_id: receiverId,
        title: 'Connect thanh cong',
        message: `Ban da duoc chot cho don "${donation.title}". Hay chon cach nhan hang.`,
        type: 'DONATION_CONNECT_APPROVED',
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

    await NotificationService.notifyDonorNewOrder(donorId, {
        receiver_name: receiverName,
        quantity: donation.quantity,
        order_id: donation._id.toString(),
    }).catch(() => {});

    return {
        message: 'Kết nối thành công. Bạn có thể chọn phương thức nhận ngay.',
        already_connected: false,
        auto_approved: true,
    };
}

// ── PATCH /api/food-donations/:id/receiver-delivery-choice ───────────────────
// Receiver chọn VIA_AGENT (kèm preferred volunteer optional) hoặc SELF_PICKUP.
// Tạo Delivery, sinh pickup_code 4 chữ số khi VIA_AGENT.
async function chooseDeliveryByReceiver(donationId, receiverId, deliveryType, preferredVolunteerId = null) {
    const VALID_TYPES = ['VIA_AGENT', 'SELF_PICKUP'];
    if (!VALID_TYPES.includes(deliveryType)) {
        throw _error('delivery_type không hợp lệ. Giá trị hợp lệ: VIA_AGENT, SELF_PICKUP.');
    }

    let preferredVolunteer = null;
    if (deliveryType === 'VIA_AGENT' && preferredVolunteerId) {
        preferredVolunteer = await User.findOne({
            _id: preferredVolunteerId,
            role: 'VOLUNTEER',
            profile_completed: true,
        })
            .select('_id full_name')
            .lean();

        if (!preferredVolunteer) {
            throw _error('Volunteer được chọn không hợp lệ hoặc chưa sẵn sàng nhận đơn.', 400);
        }
    }

    const donation = await FoodDonation.findById(donationId).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    if (donation.status !== 'PENDING') {
        throw _error('Đơn này không còn ở trạng thái có thể chọn phương thức nhận.');
    }

    if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
        throw _error('Bạn chưa được donor chốt cho đơn này.', 403);
    }

    if (donation.delivery_id) {
        const existingDelivery = await Delivery.findById(donation.delivery_id).lean();
        return {
            message: 'Đơn này đã chọn phương thức nhận trước đó.',
            already_selected: true,
            donation: {
                id: donation._id,
                delivery_type: donation.delivery_type,
                delivery_id: donation.delivery_id,
            },
            delivery: existingDelivery,
        };
    }

    const deliveryStatus = deliveryType === 'VIA_AGENT' ? 'WAITING_AGENT' : 'SELF_PICKUP_READY';
    // Sinh pickup_code 4 chữ số khi VIA_AGENT. Donor đọc cho volunteer khi gặp mặt.
    const pickupCode = deliveryType === 'VIA_AGENT'
        ? pickupCodeUtil.generatePickupCode()
        : null;

    const delivery = await Delivery.create({
        donation_id: donation._id,
        donor_id: donation.donor_id,
        receiver_id: receiverId,
        delivery_type: deliveryType,
        status: deliveryStatus,
        pickup_code: pickupCode,
        preferred_volunteer_id:
            deliveryType === 'VIA_AGENT' && preferredVolunteer
                ? preferredVolunteer._id
                : null,
    });

    await FoodDonation.updateOne(
        { _id: donationId },
        {
            $set: {
                delivery_id: delivery._id,
                delivery_type: deliveryType,
                status: deliveryType === 'SELF_PICKUP' ? 'ACCEPTED' : 'PENDING',
            },
        },
    );

    const receiver = await User.findById(receiverId).select('full_name').lean();
    const receiverName = receiver?.full_name || 'Receiver';

    await Notification.create({
        user_id: donation.donor_id,
        title: 'Receiver da chon cach nhan hang',
        message: `${receiverName} chon ${deliveryType === 'VIA_AGENT' ? 'uy thac volunteer' : 'tu lay hang'} cho don "${donation.title}"`,
        type: 'DELIVERY_CHOICE_SELECTED',
        related_entity_type: 'Delivery',
        related_entity_id: delivery._id,
    });

    await NotificationService.notifyDonorNewOrder(donation.donor_id, {
        receiver_name: receiverName,
        quantity: donation.quantity,
        order_id: delivery._id.toString(),
    }).catch(() => {});

    return {
        message: 'Đã chọn phương thức nhận hàng.',
        already_selected: false,
        donation: {
            id: donation._id,
            delivery_type: deliveryType,
            delivery_id: delivery._id,
            preferred_volunteer_id:
                deliveryType === 'VIA_AGENT' && preferredVolunteer
                    ? preferredVolunteer._id
                    : null,
        },
        delivery,
    };
}

// ── PATCH /api/food-donations/:id/self-pickup-complete ───────────────────────
// Receiver xác nhận đã tự lấy hàng — set DELIVERED + cộng điểm donor.
async function completeSelfPickupByReceiver(donationId, receiverId) {
    const donation = await FoodDonation.findById(donationId).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
        throw _error('Bạn không có quyền xác nhận đơn này.', 403);
    }

    if (donation.delivery_type !== 'SELF_PICKUP' || !donation.delivery_id) {
        throw _error('Đơn này không ở chế độ tự lấy hàng.', 400);
    }

    const delivery = await Delivery.findById(donation.delivery_id).lean();
    if (!delivery) throw _error('Không tìm thấy delivery của đơn này.', 404);

    if (delivery.status === 'DELIVERED') {
        return { message: 'Đơn đã được xác nhận hoàn tất trước đó.', already_completed: true };
    }

    if (delivery.status !== 'SELF_PICKUP_READY') {
        throw _error('Đơn chưa ở trạng thái có thể xác nhận tự lấy hàng.', 400);
    }

    // Atomic: SELF_PICKUP_READY → DELIVERED (chống double-confirm).
    const deliveryStatusUpdate = await Delivery.updateOne(
        { _id: delivery._id, status: 'SELF_PICKUP_READY' },
        { $set: { status: 'DELIVERED', delivered_at: new Date() } },
    );

    if (deliveryStatusUpdate.modifiedCount === 0) {
        return {
            message: 'Đơn đã được xác nhận giao hoàn tất trước đó.',
            already_completed: true,
            points_awarded_to_donor: 0,
        };
    }

    const donationStatusUpdate = await FoodDonation.updateOne(
        { _id: donation._id, status: { $ne: 'COMPLETED' } },
        { $set: { status: 'COMPLETED' } },
    );

    const pointsAwardedToDonor = donationStatusUpdate.modifiedCount > 0
        ? await awardDonorCompletionPoints(donation.donor_id)
        : 0;

    const receiver = await User.findById(receiverId).select('full_name').lean();
    const receiverName = receiver?.full_name || 'Receiver';

    await Notification.create({
        user_id: donation.donor_id,
        title: 'Receiver da tu lay hang thanh cong',
        message: `${receiverName} da xac nhan hoan tat tu lay hang cho don "${donation.title}"`,
        type: 'SELF_PICKUP_COMPLETED',
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

    await NotificationService.sendToUser(donation.donor_id, {
        title: 'Self pickup completed',
        body: `${receiverName} has confirmed pickup for "${donation.title}"`,
        data: {
            type: 'SELF_PICKUP_COMPLETED',
            donation_id: donation._id.toString(),
        },
    }).catch(() => {});

    return {
        message: 'Xác nhận tự lấy hàng thành công.',
        already_completed: false,
        points_awarded_to_donor: pointsAwardedToDonor,
    };
}

module.exports = {
    connectDonationByReceiver,
    chooseDeliveryByReceiver,
    completeSelfPickupByReceiver,
};
