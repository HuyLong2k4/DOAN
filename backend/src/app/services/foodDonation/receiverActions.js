/**
 * Receiver actions: connect donation, chọn delivery type, tự xác nhận khi self-pickup.
 *
 * (Confirm-received cho VIA_AGENT nằm ở `./receiverConfirm.js`.)
 */

const FoodDonation = require('../../models/foodDonationModel');
const FoodRequest = require('../../models/foodRequestModel');
const Delivery = require('../../models/deliveryModel');
const User = require('../../models/userModel');
const Notification = require('../../models/notificationModel');
const NotificationService = require('../notificationService');
const { archiveDonationConversations } = require('./archiveConversations');
const DonorProfile = require('../../models/donorProfileModel');
const VolunteerProfile = require('../../models/volunteerProfileModel');
const pickupCodeUtil = require('./pickupCode');
const { distanceKm } = require('./distance');
const { awardDonorCompletionPoints } = require('./points');

// Bán kính ưu tiên thông báo cho volunteer (km). Volunteer xa hơn ngưỡng này
// sẽ không nhận push để tránh spam — họ vẫn có thể thấy đơn trong list nếu mở app.
const VOLUNTEER_BROADCAST_RADIUS_KM = 20;

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

    // Atomic claim — chỉ chốt khi đơn vẫn PENDING & chưa có receiver. Chống race:
    // hai receiver bấm cùng lúc thì chỉ một người thắng, người kia nhận 409.
    const claim = await FoodDonation.updateOne(
        { _id: donationId, status: 'PENDING', selected_receiver_id: null },
        { $set: { selected_receiver_id: receiverId, selected_at: new Date() } },
    );
    if (claim.modifiedCount === 0) {
        throw _error('Đơn vừa được người khác nhận. Vui lòng chọn đơn khác.', 409);
    }

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
// Receiver chọn VIA_AGENT hoặc SELF_PICKUP.
//   - VIA_AGENT: hệ thống auto-match volunteer (ai-accept-trước-thắng). Đơn
//     được broadcast push notification tới các volunteer trong bán kính
//     VOLUNTEER_BROADCAST_RADIUS_KM từ donor. Không còn pre-select volunteer.
//   - SELF_PICKUP: receiver tự đến lấy.
// Tạo Delivery, sinh pickup_code 4 chữ số khi VIA_AGENT.
async function chooseDeliveryByReceiver(donationId, receiverId, deliveryType /* , _legacyPreferredVolunteerId */) {
    const VALID_TYPES = ['VIA_AGENT', 'SELF_PICKUP'];
    if (!VALID_TYPES.includes(deliveryType)) {
        throw _error('delivery_type không hợp lệ. Giá trị hợp lệ: VIA_AGENT, SELF_PICKUP.');
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
    // Sinh pickup_code 4 chữ số cho cả VIA_AGENT + SELF_PICKUP.
    // - VIA_AGENT: donor đọc cho volunteer khi gặp mặt.
    // - SELF_PICKUP: donor đọc cho receiver khi receiver đến lấy.
    const pickupCode = pickupCodeUtil.generatePickupCode();

    // Auto-match: không pre-select volunteer. Ai accept trước thì thắng.
    const delivery = await Delivery.create({
        donation_id: donation._id,
        donor_id: donation.donor_id,
        receiver_id: receiverId,
        delivery_type: deliveryType,
        status: deliveryStatus,
        pickup_code: pickupCode,
    });

    // Atomic claim: chỉ gán delivery khi đơn vẫn PENDING, đúng receiver và CHƯA có
    // delivery. Chống double-tap tạo ra 2 Delivery (mồ côi + 2 broadcast/pickup code).
    const claim = await FoodDonation.updateOne(
        { _id: donationId, status: 'PENDING', selected_receiver_id: receiverId, delivery_id: null },
        {
            $set: {
                delivery_id: delivery._id,
                delivery_type: deliveryType,
                status: deliveryType === 'SELF_PICKUP' ? 'ACCEPTED' : 'PENDING',
            },
        },
    );
    if (claim.modifiedCount === 0) {
        // Mất cuộc đua — xoá delivery vừa tạo, trả về phương thức đã chốt trước đó.
        await Delivery.deleteOne({ _id: delivery._id }).catch(() => {});
        const fresh = await FoodDonation.findById(donationId).lean();
        const existingDelivery = fresh?.delivery_id
            ? await Delivery.findById(fresh.delivery_id).lean()
            : null;
        return {
            message: 'Đơn này đã chọn phương thức nhận trước đó.',
            already_selected: true,
            donation: {
                id: donation._id,
                delivery_type: fresh?.delivery_type ?? null,
                delivery_id: fresh?.delivery_id ?? null,
            },
            delivery: existingDelivery,
        };
    }

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

    // Broadcast push tới volunteer trong bán kính — fire-and-forget, không
    // block response. Volunteer offline cũng nhận được push khi mở lại app.
    if (deliveryType === 'VIA_AGENT') {
        void broadcastDonationToNearbyVolunteers(donation, delivery._id).catch((err) => {
            console.error('[broadcast volunteer push] error:', err?.message || err);
        });
    }

    return {
        message: 'Đã chọn phương thức nhận hàng.',
        already_selected: false,
        donation: {
            id: donation._id,
            delivery_type: deliveryType,
            delivery_id: delivery._id,
        },
        delivery,
    };
}

// Push tới các volunteer trong bán kính VOLUNTEER_BROADCAST_RADIUS_KM từ donor.
// Lấy donor lat/lng từ DonorProfile; volunteer profile có lat/lng tương ứng.
// Filter ra volunteer không có toạ độ (không tính được khoảng cách).
async function broadcastDonationToNearbyVolunteers(donation, deliveryId) {
    const donorProfile = await DonorProfile.findOne({ user_id: donation.donor_id })
        .select('latitude longitude')
        .lean();

    if (!donorProfile || donorProfile.latitude == null || donorProfile.longitude == null) {
        return; // Không có vị trí donor → bỏ qua broadcast (volunteer vẫn thấy trong list).
    }

    const volunteerProfiles = await VolunteerProfile.find({ is_active: true })
        .select('user_id latitude longitude')
        .populate({
            path: 'user_id',
            select: '_id role profile_completed',
            match: { role: 'VOLUNTEER', profile_completed: true },
        })
        .lean();

    const nearbyVolunteerIds = volunteerProfiles
        .filter((vp) => vp.user_id && vp.latitude != null && vp.longitude != null)
        .filter((vp) => {
            const km = distanceKm(donorProfile.latitude, donorProfile.longitude, vp.latitude, vp.longitude);
            return km != null && km <= VOLUNTEER_BROADCAST_RADIUS_KM;
        })
        .map((vp) => String(vp.user_id._id));

    if (nearbyVolunteerIds.length === 0) return;

    // In-app notifications.
    await Notification.insertMany(
        nearbyVolunteerIds.map((volunteerId) => ({
            user_id: volunteerId,
            title: 'Co don can volunteer',
            message: `Don "${donation.title}" gan ban dang can volunteer giao.`,
            type: 'VOLUNTEER_DONATION_BROADCAST',
            related_entity_type: 'Delivery',
            related_entity_id: deliveryId,
        })),
    ).catch(() => {});

    // Push notifications (chunked 100/lần bên trong sendToMultipleUsers).
    await NotificationService.sendToMultipleUsers(nearbyVolunteerIds, {
        title: 'Co don can volunteer gan ban',
        body: `Don "${donation.title}" dang doi nguoi giao.`,
        data: {
            type: 'VOLUNTEER_DONATION_BROADCAST',
            donation_id: String(donation._id),
            delivery_id: String(deliveryId),
        },
    }).catch(() => {});
}

// ── PATCH /api/food-donations/:id/receiver-disconnect ───────────────────────
// Receiver tự rút khỏi đơn trước khi pickup. Khác với donor release (cần đợi 30
// phút), receiver có thể rút bất cứ lúc nào trước khi volunteer pickup-start.
// Hai nhánh xử lý:
//   A. Donation tạo từ FoodRequest (donor đã accept request): huỷ donation +
//      reset food_request về PENDING để donor khác accept lại được.
//   B. Donation donor tự đăng: donation về PENDING + bỏ selected_receiver_id,
//      mở lại cho receiver khác connect.
const NON_PICKUP_DELIVERY_STATUSES = new Set([
    'WAITING_AGENT',
    'SELF_PICKUP_READY',
    'AGENT_ASSIGNED',
]);

async function disconnectDonationByReceiver(donationId, receiverId) {
    const donation = await FoodDonation.findById(donationId).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
        throw _error('Bạn không phải receiver của đơn này.', 403);
    }

    if (['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(donation.status)) {
        throw _error('Đơn đã kết thúc, không thể rút.', 400);
    }

    const delivery = donation.delivery_id
        ? await Delivery.findById(donation.delivery_id).select('_id status').lean()
        : null;

    if (delivery && !NON_PICKUP_DELIVERY_STATUSES.has(delivery.status)) {
        throw _error('Đơn đang được lấy/giao, không thể rút. Vui lòng liên hệ hỗ trợ nếu cần huỷ.', 400);
    }

    const previousVolunteerId = donation.volunteer_id ? String(donation.volunteer_id) : null;
    const donorId = String(donation.donor_id);

    // Phát hiện donation từ FoodRequest.
    const linkedRequest = await FoodRequest.findOne({ linked_donation_id: donation._id })
        .select('_id receiver_id title status')
        .lean();
    const isFromRequest = Boolean(linkedRequest);

    if (isFromRequest) {
        // Nhánh A: huỷ donation hoàn toàn, mở lại food_request.
        const result = await FoodDonation.updateOne(
            { _id: donationId, selected_receiver_id: receiverId, status: { $in: ['PENDING', 'ACCEPTED'] } },
            { $set: { status: 'CANCELLED' } },
        );
        if (result.modifiedCount === 0) {
            throw _error('Đơn đã đổi trạng thái, không thể rút.', 409);
        }
        await FoodRequest.updateOne(
            { _id: linkedRequest._id },
            {
                $set: {
                    status: 'PENDING',
                    accepted_by_donor_id: null,
                    linked_donation_id: null,
                },
            },
        );
    } else {
        // Nhánh B: donation về PENDING + bỏ receiver/volunteer/delivery.
        const result = await FoodDonation.updateOne(
            { _id: donationId, selected_receiver_id: receiverId, status: { $in: ['PENDING', 'ACCEPTED'] } },
            {
                $set: {
                    status: 'PENDING',
                    selected_receiver_id: null,
                    volunteer_id: null,
                    delivery_id: null,
                    delivery_type: null,
                    selected_at: null,
                    rejected_by: [],
                },
            },
        );
        if (result.modifiedCount === 0) {
            throw _error('Đơn đã đổi trạng thái, không thể rút.', 409);
        }
    }

    if (donation.delivery_id) {
        await Delivery.updateOne(
            {
                _id: donation.delivery_id,
                status: { $in: Array.from(NON_PICKUP_DELIVERY_STATUSES) },
            },
            { $set: { status: 'CANCELLED', cancelled_at: new Date() } },
        );
    }

    // Notify donor + volunteer (nếu đã assigned).
    const targets = [donorId, previousVolunteerId].filter(Boolean);
    if (targets.length > 0) {
        const notifTitle = isFromRequest ? 'Receiver da rut request' : 'Receiver da rut khoi don';
        const notifBody = isFromRequest
            ? `Receiver da rut khoi request "${donation.title}". Request da duoc mo lai.`
            : `Receiver da rut khoi don "${donation.title}". Don san sang cho receiver khac.`;
        const notifType = isFromRequest ? 'FOOD_REQUEST_REOPENED' : 'DONATION_RECEIVER_DISCONNECTED';

        await Notification.insertMany(
            targets.map((userId) => ({
                user_id: userId,
                title: notifTitle,
                message: notifBody,
                type: notifType,
                related_entity_type: 'FoodDonation',
                related_entity_id: donation._id,
            })),
        ).catch(() => {});

        await NotificationService.sendToMultipleUsers(targets, {
            title: notifTitle,
            body: notifBody,
            data: {
                type: notifType,
                donation_id: donation._id.toString(),
                ...(isFromRequest && linkedRequest ? { request_id: String(linkedRequest._id) } : {}),
            },
        }).catch(() => {});
    }

    await archiveDonationConversations(donation._id);

    return {
        message: isFromRequest
            ? 'Đã rút khỏi đơn. Food request của bạn đã được mở lại.'
            : 'Đã rút khỏi đơn. Donor có thể chọn receiver khác.',
        from_food_request: isFromRequest,
    };
}

// ── PATCH /api/food-donations/:id/report-no-show ───────────────────────────
// Receiver báo volunteer không đến giao sau khi đã pickup. Chỉ cho phép khi
// delivery đã ON_THE_WAY quá MIN_NOSHOW_AGE_HOURS giờ tính từ `picked_up_at`.
// Hành động: cancel delivery + cancel donation, notify volunteer + donor.
// Food coi như đã mất (volunteer đã cầm đi nhưng không giao tới).
const MIN_NOSHOW_AGE_HOURS = 2;
const MIN_NOSHOW_AGE_MS = MIN_NOSHOW_AGE_HOURS * 60 * 60 * 1000;

async function reportVolunteerNoShow(donationId, receiverId) {
    const donation = await FoodDonation.findById(donationId).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
        throw _error('Bạn không phải receiver của đơn này.', 403);
    }

    if (!donation.delivery_id) {
        throw _error('Đơn này chưa có volunteer giao.', 400);
    }

    const delivery = await Delivery.findById(donation.delivery_id).lean();
    if (!delivery) throw _error('Không tìm thấy delivery của đơn này.', 404);

    if (delivery.status !== 'ON_THE_WAY') {
        throw _error('Chỉ được báo no-show khi đơn đang giao.', 400);
    }

    const pickedUpAt = delivery.picked_up_at ? new Date(delivery.picked_up_at).getTime() : null;
    if (!pickedUpAt) {
        throw _error('Đơn chưa có thông tin pickup hợp lệ.', 400);
    }

    const ageMs = Date.now() - pickedUpAt;
    if (ageMs < MIN_NOSHOW_AGE_MS) {
        const remainingMin = Math.ceil((MIN_NOSHOW_AGE_MS - ageMs) / 60000);
        throw _error(`Vui lòng đợi thêm ${remainingMin} phút trước khi báo volunteer không đến.`, 400);
    }

    // Atomic cancel delivery (ON_THE_WAY → CANCELLED) + cancel donation.
    const deliveryUpdate = await Delivery.updateOne(
        { _id: delivery._id, status: 'ON_THE_WAY' },
        { $set: { status: 'CANCELLED', cancelled_at: new Date() } },
    );
    if (deliveryUpdate.modifiedCount === 0) {
        throw _error('Delivery đã đổi trạng thái, không thể báo no-show.', 409);
    }

    await FoodDonation.updateOne(
        { _id: donation._id, status: { $nin: ['COMPLETED', 'EXPIRED', 'CANCELLED'] } },
        { $set: { status: 'CANCELLED' } },
    );

    const volunteerId = delivery.volunteer_id ? String(delivery.volunteer_id) : null;
    const donorId = String(donation.donor_id);

    const targets = [donorId, volunteerId].filter(Boolean);
    if (targets.length > 0) {
        await Notification.insertMany(
            targets.map((userId) => ({
                user_id: userId,
                title: 'Bao cao volunteer khong den',
                message: `Receiver bao volunteer khong den giao don "${donation.title}" sau hon ${MIN_NOSHOW_AGE_HOURS}h. Don da bi huy.`,
                type: 'VOLUNTEER_NO_SHOW',
                related_entity_type: 'FoodDonation',
                related_entity_id: donation._id,
            })),
        ).catch(() => {});

        await NotificationService.sendToMultipleUsers(targets, {
            title: 'Volunteer khong giao den',
            body: `Don "${donation.title}" da bi huy do volunteer khong giao.`,
            data: {
                type: 'VOLUNTEER_NO_SHOW',
                donation_id: donation._id.toString(),
                delivery_id: String(delivery._id),
            },
        }).catch(() => {});
    }

    await archiveDonationConversations(donation._id);
    return { message: 'Đã ghi nhận báo cáo. Đơn đã được huỷ.' };
}

// ── PATCH /api/food-donations/:id/self-pickup-complete ───────────────────────
// Receiver xác nhận đã tự lấy hàng — phải nhập đúng pickup_code do donor cung
// cấp. Sau khi verify → set DELIVERED + cộng điểm donor.
async function completeSelfPickupByReceiver(donationId, receiverId, pickupCode = null) {
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

    // Verify pickup_code kèm chống brute-force (throw nếu sai/đang khoá).
    await pickupCodeUtil.assertPickupCode(delivery, pickupCode);

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

    await archiveDonationConversations(donation._id);

    return {
        message: 'Xác nhận tự lấy hàng thành công.',
        already_completed: false,
        points_awarded_to_donor: pointsAwardedToDonor,
    };
}

module.exports = {
    connectDonationByReceiver,
    chooseDeliveryByReceiver,
    disconnectDonationByReceiver,
    reportVolunteerNoShow,
    completeSelfPickupByReceiver,
    MIN_NOSHOW_AGE_HOURS,
};
