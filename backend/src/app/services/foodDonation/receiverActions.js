//Receiver actions: connect donation, chọn delivery type, tự xác nhận khi self-pickup.
const FoodDonation = require('../../models/foodDonationModel');
const FoodRequest = require('../../models/foodRequestModel');
const Delivery = require('../../models/deliveryModel');
const User = require('../../models/userModel');
const NotificationService = require('../notificationService');
const ReportService = require('../reportService');
const { archiveDonationConversations } = require('./archiveConversations');
const DonorProfile = require('../../models/donorProfileModel');
const VolunteerProfile = require('../../models/volunteerProfileModel');
const pickupCodeUtil = require('./pickupCode');
const { distanceKm } = require('./distance');
const { awardDonorCompletionPoints } = require('./points');
const { assertReceiverClaimLimit } = require('./receiverClaimLimit');

// Bán kính ưu tiên thông báo cho volunteer (km). Volunteer xa hơn ngưỡng này
// sẽ không nhận push để tránh spam — họ vẫn có thể thấy đơn trong list nếu mở app.
const VOLUNTEER_BROADCAST_RADIUS_KM = 20;

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

function _normalizeClaimQuantity(value, availableQuantity) {
    const available = Number(availableQuantity);
    if (!Number.isSafeInteger(available) || available < 1) {
        throw _error('Đơn không hợp lệ: số suất còn lại không đúng.', 400);
    }

    if (value == null || value === '') return available;

    const quantity = Number(value);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw _error('Số suất muốn nhận phải là số nguyên và >= 1.', 400);
    }

    if (quantity > available) {
        throw _error(`Chỉ còn ${available} suất có thể nhận.`, 400);
    }

    return quantity;
}

// ── PATCH /api/food-donations/:id/connect ────────────────────────────────────
// Auto-match: receiver bấm connect → tự được chốt (selected_receiver_id).
async function connectDonationByReceiver(donationId, receiverId, requestedQuantity = null) {
    const donation = await FoodDonation.findById(donationId)
        .populate('donor_id', 'full_name')
        .lean();

    if (!donation) {
        throw _error('Đơn quyên góp không tồn tại.', 404);
    }    

    if (donation.status !== 'PENDING') {
        throw _error('Đơn này không còn khả dụng để connect.');
    }

    const claimQuantity = _normalizeClaimQuantity(requestedQuantity, donation.quantity);

    if (donation.selected_receiver_id) {
        const selectedId = donation.selected_receiver_id.toString();
        if (selectedId === receiverId.toString()) {
            return {
                message: 'Bạn đã được chốt cho đơn này. Hãy chọn phương thức nhận hàng.',
                already_connected: true,
                auto_approved: true,
                donation_id: donation._id.toString(),
                claimed_quantity: donation.quantity,
                remaining_quantity: 0,
                split: false,
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

    const selectedAt = new Date();
    await assertReceiverClaimLimit(receiverId, selectedAt, 'Bạn');

    // Claim atomic: nhận toàn bộ thì gán receiver trên đơn hiện tại; nhận một phần
    // thì giảm quantity đơn gốc và tạo đơn con đã gán receiver cho phần được nhận.
    let connectedDonation = null;
    let remainingQuantity = 0;
    let split = false;

    if (claimQuantity === donation.quantity) {
        const claim = await FoodDonation.updateOne(
            { _id: donationId, status: 'PENDING', selected_receiver_id: null },
            {
                $set: { selected_receiver_id: receiverId, selected_at: selectedAt },
                $push: { receiver_claim_history: { receiver_id: receiverId, claimed_at: selectedAt } },
            },
        );
        if (claim.modifiedCount === 0) {
            throw _error('Đơn vừa được người khác nhận. Vui lòng chọn đơn khác.', 409);
        }
        connectedDonation = { ...donation, selected_receiver_id: receiverId, selected_at: selectedAt };
    } else {
        const remainingDonation = await FoodDonation.findOneAndUpdate(
            { _id: donationId, status: 'PENDING', selected_receiver_id: null, quantity: { $gt: claimQuantity } },
            { $inc: { quantity: -claimQuantity } },
            { new: true },
        ).lean();

        if (remainingDonation) {
            remainingQuantity = remainingDonation.quantity;
            split = true;

            try {
                connectedDonation = await FoodDonation.create({
                    donor_id: donorId,
                    source_donation_id: donation._id,
                    selected_receiver_id: receiverId,
                    selected_at: selectedAt,
                    receiver_claim_history: [{ receiver_id: receiverId, claimed_at: selectedAt }],
                    title: donation.title,
                    description: donation.description || null,
                    food_type: donation.food_type,
                    storage_condition: donation.storage_condition || 'ROOM',
                    quantity: claimQuantity,
                    unit: donation.unit || 'portion',
                    images: Array.isArray(donation.images) ? donation.images : [],
                    expiration_datetime: donation.expiration_datetime,
                    status: 'PENDING',
                });
            } catch (err) {
                await FoodDonation.updateOne(
                    { _id: donationId, status: 'PENDING', selected_receiver_id: null },
                    { $inc: { quantity: claimQuantity } },
                ).catch(() => {});
                throw _error('Không thể tách số suất cho đơn này. Vui lòng thử lại.', 500);
            }
        } else {
            const claim = await FoodDonation.updateOne(
                { _id: donationId, status: 'PENDING', selected_receiver_id: null, quantity: claimQuantity },
                {
                    $set: { selected_receiver_id: receiverId, selected_at: selectedAt },
                    $push: { receiver_claim_history: { receiver_id: receiverId, claimed_at: selectedAt } },
                },
            );
            if (claim.modifiedCount === 0) {
                throw _error('Số suất còn lại vừa thay đổi. Vui lòng tải lại và chọn lại.', 409);
            }
            connectedDonation = { ...donation, quantity: claimQuantity, selected_receiver_id: receiverId, selected_at: selectedAt };
        }
    }

    const receiver = await User.findById(receiverId).select('full_name').lean();
    const receiverName = receiver?.full_name || 'Một receiver';

    const connectedDonationId = connectedDonation._id || donation._id;

    await NotificationService.dispatch({
        userIds: donorId,
        key: 'donation.connectedToDonor',
        params: { receiverName, title: donation.title },
        type: 'DONATION_CONNECTED_AUTO',
        data: { donation_id: connectedDonationId.toString(), claimed_quantity: String(claimQuantity) },
        related_entity_type: 'FoodDonation',
        related_entity_id: connectedDonationId,
    });

    await NotificationService.dispatch({
        userIds: receiverId,
        key: 'donation.connectApproved',
        params: { title: donation.title },
        type: 'DONATION_CONNECT_APPROVED',
        data: { donation_id: connectedDonationId.toString(), claimed_quantity: String(claimQuantity) },
        related_entity_type: 'FoodDonation',
        related_entity_id: connectedDonationId,
    });

    return {
        message: 'Kết nối thành công. Bạn có thể chọn phương thức nhận ngay.',
        already_connected: false,
        auto_approved: true,
        donation_id: connectedDonationId.toString(),
        source_donation_id: split ? donation._id.toString() : null,
        claimed_quantity: claimQuantity,
        remaining_quantity: remainingQuantity,
        split,
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

    await NotificationService.dispatch({
        userIds: donation.donor_id,
        key: deliveryType === 'VIA_AGENT' ? 'delivery.choiceViaAgent' : 'delivery.choiceSelfPickup',
        params: { receiverName, title: donation.title },
        type: 'DELIVERY_CHOICE_SELECTED',
        data: { donation_id: donation._id.toString(), delivery_id: delivery._id.toString() },
        related_entity_type: 'Delivery',
        related_entity_id: delivery._id,
    });

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

    await NotificationService.dispatch({
        userIds: nearbyVolunteerIds,
        key: 'volunteer.broadcast',
        params: { title: donation.title },
        type: 'VOLUNTEER_DONATION_BROADCAST',
        data: { donation_id: String(donation._id), delivery_id: String(deliveryId) },
        related_entity_type: 'Delivery',
        related_entity_id: deliveryId,
    });
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
            { $set: { status: 'CANCELLED', cancel_reason: 'RECEIVER_DISCONNECTED', cancelled_at: new Date() } },
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
    await NotificationService.dispatch({
        userIds: targets,
        key: isFromRequest ? 'donation.receiverDisconnected.request' : 'donation.receiverDisconnected.public',
        params: { title: donation.title },
        type: isFromRequest ? 'FOOD_REQUEST_REOPENED' : 'DONATION_RECEIVER_DISCONNECTED',
        data: {
            donation_id: donation._id.toString(),
            ...(isFromRequest && linkedRequest ? { request_id: String(linkedRequest._id) } : {}),
        },
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

    await archiveDonationConversations(donation._id);

    return {
        message: isFromRequest
            ? 'Đã rút khỏi đơn. Food request của bạn đã được mở lại.'
            : 'Đã rút khỏi đơn. Donor có thể chọn receiver khác.',
        from_food_request: isFromRequest,
    };
}

// ── PATCH /api/food-donations/:id/report-no-show ───────────────────────────
// Receiver báo volunteer không đến giao sau khi volunteer đã pickup. Cho phép
// ngay khi delivery ở ON_THE_WAY — không bắt đợi mốc thời gian nào. Receiver là
// người trực tiếp biết hàng đã tới hay chưa nên được chủ động báo bất cứ lúc nào.
// Hành động: cancel delivery + cancel donation, notify volunteer + donor.
// Food coi như đã mất (volunteer đã cầm đi nhưng không giao tới).
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

    const volunteerId = delivery.volunteer_id ? String(delivery.volunteer_id) : null;
    if (!volunteerId) {
        throw _error('Delivery đang giao nhưng không xác định được volunteer.', 409);
    }

    // Nếu lần xử lý trước đã huỷ đơn nhưng bị ngắt trước khi trả response, request
    // gửi lại sẽ tự sửa/đảm bảo report tồn tại thay vì trả lỗi và mất dấu sự cố.
    const alreadyCancelledAsNoShow =
        delivery.status === 'CANCELLED' &&
        donation.status === 'CANCELLED' &&
        donation.cancel_reason === 'VOLUNTEER_NO_SHOW';
    if (alreadyCancelledAsNoShow) {
        await ReportService.ensureVolunteerNoShowReport({
            reporterId: receiverId,
            volunteerId,
            donationId: donation._id,
            deliveryId: delivery._id,
        });
        await archiveDonationConversations(donation._id);
        return { message: 'Báo cáo volunteer không giao đã được ghi nhận.', already_reported: true };
    }

    if (delivery.status !== 'ON_THE_WAY') {
        throw _error('Chỉ được báo no-show khi đơn đang giao.', 400);
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
        { $set: { status: 'CANCELLED', cancel_reason: 'VOLUNTEER_NO_SHOW', cancelled_at: new Date() } },
    );

    const donorId = String(donation.donor_id);

    // Đưa sự cố vào hàng chờ xử lý của admin, gắn đúng receiver, volunteer và
    // donation. ReportService dùng upsert nên không tạo trùng nếu request lặp lại.
    await ReportService.ensureVolunteerNoShowReport({
        reporterId: receiverId,
        volunteerId,
        donationId: donation._id,
        deliveryId: delivery._id,
    });

    const targets = [donorId, volunteerId].filter(Boolean);
    await NotificationService.dispatch({
        userIds: targets,
        key: 'volunteer.noShowReported',
        params: { title: donation.title },
        type: 'VOLUNTEER_NO_SHOW',
        data: { donation_id: donation._id.toString(), delivery_id: String(delivery._id) },
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

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

    await NotificationService.dispatch({
        userIds: donation.donor_id,
        key: 'selfPickup.completed',
        params: { receiverName, title: donation.title },
        type: 'SELF_PICKUP_COMPLETED',
        data: { donation_id: donation._id.toString() },
        related_entity_type: 'FoodDonation',
        related_entity_id: donation._id,
    });

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
};
