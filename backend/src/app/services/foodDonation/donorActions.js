/**
 * Donor actions: tạo đơn, huỷ đơn (chỉ khi PENDING), và "release receiver".
 *
 * Release-receiver: sau 30 phút từ lúc receiver connect, nếu receiver/volunteer
 * vẫn chưa đến lấy hàng (delivery vẫn ở WAITING_AGENT / SELF_PICKUP_READY /
 * AGENT_ASSIGNED), donor được quyền tách receiver ra khỏi đơn. Đơn quay về
 * PENDING + selected_receiver_id=null để receiver khác có thể connect.
 * Thời hạn (expiration_datetime) của đơn giữ nguyên.
 */

const FoodDonation = require('../../models/foodDonationModel');
const FoodRequest = require('../../models/foodRequestModel');
const Delivery = require('../../models/deliveryModel');
const Notification = require('../../models/notificationModel');
const NotificationService = require('../notificationService');
const { archiveDonationConversations } = require('./archiveConversations');

const VALID_FOOD_TYPE = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];

const STALE_PICKUP_MS = 30 * 60 * 1000;
const STALE_DELIVERY_STATUSES = new Set(['WAITING_AGENT', 'SELF_PICKUP_READY', 'AGENT_ASSIGNED']);

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

/**
 * Tính khả năng release receiver cho donor.
 * - Mốc đếm 30 phút lấy từ donation.selected_at (lúc receiver connect),
 *   fallback delivery.createdAt nếu thiếu.
 * @param {object} donation  Document FoodDonation đã .lean()
 * @param {object|null} delivery  Document Delivery đã .lean() (có thể null)
 * @returns {{ canRelease: boolean, selectedAt: Date|null, releaseEligibleAt: Date|null, reason: string|null }}
 */
function computeReleaseReceiverEligibility(donation, delivery) {
    if (['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(donation.status)) {
        return { canRelease: false, selectedAt: null, releaseEligibleAt: null, reason: 'finalized' };
    }
    if (!donation.selected_receiver_id) {
        return { canRelease: false, selectedAt: null, releaseEligibleAt: null, reason: 'no_receiver' };
    }
    if (delivery && !STALE_DELIVERY_STATUSES.has(delivery.status)) {
        // ON_THE_WAY / AWAITING_CONFIRMATION / DELIVERED → đã quá muộn để release.
        return { canRelease: false, selectedAt: donation.selected_at || null, releaseEligibleAt: null, reason: 'in_progress' };
    }

    // Ưu tiên delivery.createdAt — timer 30-min đếm từ lúc receiver commit
    // pickup method (chọn VIA_AGENT/SELF_PICKUP), không phải từ lúc connect.
    // Fallback selected_at khi receiver chưa kịp chọn delivery (vd. donor vừa
    // accept request, receiver chưa response).
    const referenceAt = delivery?.createdAt
        ? new Date(delivery.createdAt)
        : (donation.selected_at ? new Date(donation.selected_at) : null);
    if (!referenceAt) {
        return { canRelease: false, selectedAt: null, releaseEligibleAt: null, reason: 'unknown_age' };
    }

    const ageMs = Date.now() - referenceAt.getTime();
    const eligibleAt = new Date(referenceAt.getTime() + STALE_PICKUP_MS);
    if (ageMs >= STALE_PICKUP_MS) {
        return { canRelease: true, selectedAt: referenceAt, releaseEligibleAt: eligibleAt, reason: 'stale' };
    }
    return { canRelease: false, selectedAt: referenceAt, releaseEligibleAt: eligibleAt, reason: 'waiting' };
}

// ── POST /api/food-donations ─────────────────────────────────────────────────
async function createDonation(donorId, data) {
    const {
        title, description,
        food_type,
        quantity, unit,
        expiration_datetime,
        images,
    } = data;

    if (!title)                    throw _error('title là bắt buộc.');
    if (!food_type)                throw _error('food_type là bắt buộc.');
    if (!quantity || quantity < 1) throw _error('quantity phải >= 1.');
    if (!expiration_datetime)      throw _error('expiration_datetime là bắt buộc.');

    if (!VALID_FOOD_TYPE.includes(food_type)) {
        throw _error(`food_type không hợp lệ. Các giá trị hợp lệ: ${VALID_FOOD_TYPE.join(', ')}`);
    }

    let normalizedImages = [];
    if (Array.isArray(images)) {
        normalizedImages = images
            .filter((url) => typeof url === 'string' && url.trim().length > 0)
            .map((url) => url.trim())
            .slice(0, 6);
    }

    const donation = await FoodDonation.create({
        donor_id:           donorId,
        title,
        description:        description || null,
        food_type,
        quantity,
        unit:               unit || 'portion',
        expiration_datetime: new Date(expiration_datetime),
        images:             normalizedImages,
    });

    return { message: 'Tạo đơn quyên góp thành công.', donation };
}

// ── PATCH /api/food-donations/:id/cancel ─────────────────────────────────────
// Donor huỷ đơn khi đang PENDING (trước khi receiver/volunteer pickup).
// Lưu ý: sau khi receiver connect (status vẫn PENDING) donor vẫn được huỷ cả đơn.
// Nếu chỉ muốn "đá" receiver mà giữ đơn lại, dùng release-receiver thay vì cancel.
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
                status: { $in: Array.from(STALE_DELIVERY_STATUSES) },
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

    await archiveDonationConversations(donation._id);
    return { message: 'Đã huỷ đơn quyên góp.' };
}

// ── PATCH /api/food-donations/:id/release-receiver ──────────────────────────
// Sau 30 phút từ lúc receiver connect/được match mà chưa pickup, donor được
// quyền giải phóng receiver. Hai nhánh xử lý:
//
//   A. Donation tạo từ FoodRequest (donor accept request của receiver):
//      → huỷ luôn donation (CANCELLED) + reset food request về PENDING để
//        request mở lại cho donor khác accept. Donor không phải giữ thức ăn
//        đã chuẩn bị riêng cho receiver "no-show".
//
//   B. Donation do donor tự đăng (receiver connect sau):
//      → chỉ release receiver, donation về PENDING để receiver khác connect
//        (thức ăn đăng public, ai cũng có thể nhận).
async function releaseReceiverByDonor(donationId, donorId) {
    const donation = await FoodDonation.findOne({ _id: donationId, donor_id: donorId }).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    const delivery = donation.delivery_id
        ? await Delivery.findById(donation.delivery_id).select('_id status createdAt').lean()
        : null;

    const eligibility = computeReleaseReceiverEligibility(donation, delivery);
    if (!eligibility.canRelease) {
        if (eligibility.reason === 'finalized') {
            throw _error('Đơn đã kết thúc, không thể giải phóng receiver.', 400);
        }
        if (eligibility.reason === 'no_receiver') {
            throw _error('Đơn chưa được receiver nhận.', 400);
        }
        if (eligibility.reason === 'in_progress') {
            throw _error('Đơn đang được lấy/giao, không thể giải phóng receiver.', 400);
        }
        if (eligibility.reason === 'waiting') {
            const remainingMs = eligibility.releaseEligibleAt
                ? Math.max(0, eligibility.releaseEligibleAt.getTime() - Date.now())
                : STALE_PICKUP_MS;
            const remainingMin = Math.ceil(remainingMs / 60000);
            throw _error(`Hãy đợi thêm ${remainingMin} phút. Sau đó bạn có thể giải phóng receiver.`, 400);
        }
        throw _error('Không thể giải phóng receiver lúc này.', 400);
    }

    const previousReceiverId = donation.selected_receiver_id ? String(donation.selected_receiver_id) : null;
    const previousVolunteerId = donation.volunteer_id ? String(donation.volunteer_id) : null;

    // Phát hiện donation có phải tạo từ FoodRequest hay không.
    const linkedRequest = await FoodRequest.findOne({ linked_donation_id: donation._id })
        .select('_id receiver_id title status')
        .lean();
    const isFromRequest = Boolean(linkedRequest);

    if (isFromRequest) {
        // Nhánh A: huỷ donation hoàn toàn.
        const result = await FoodDonation.updateOne(
            { _id: donationId, donor_id: donorId, status: { $in: ['PENDING', 'ACCEPTED'] } },
            { $set: { status: 'CANCELLED' } },
        );
        if (result.modifiedCount === 0) {
            throw _error('Đơn đã đổi trạng thái, không thể giải phóng receiver.', 409);
        }

        // Reset food request về PENDING để mở lại cho donor khác.
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
        // Nhánh B: chỉ reset receiver, donation tiếp tục sống ở PENDING.
        const result = await FoodDonation.updateOne(
            { _id: donationId, donor_id: donorId, selected_receiver_id: donation.selected_receiver_id },
            {
                $set: {
                    status: 'PENDING',
                    selected_receiver_id: null,
                    volunteer_id: null,
                    delivery_id: null,
                    delivery_type: null,
                    selected_at: null,
                    // Reset volunteer pool — receiver mới sẽ connect, các volunteer
                    // đã skip trước đó được thấy lại đơn.
                    rejected_by: [],
                },
            },
        );
        if (result.modifiedCount === 0) {
            throw _error('Đơn đã đổi trạng thái, không thể giải phóng receiver.', 409);
        }
    }

    // Huỷ delivery nếu còn tồn tại + chưa pickup (chung cho cả 2 nhánh).
    if (donation.delivery_id) {
        await Delivery.updateOne(
            {
                _id: donation.delivery_id,
                status: { $in: Array.from(STALE_DELIVERY_STATUSES) },
            },
            { $set: { status: 'CANCELLED', cancelled_at: new Date() } },
        );
    }

    // Notify receiver + volunteer (nếu có).
    const targets = [previousReceiverId, previousVolunteerId].filter(Boolean);
    if (targets.length > 0) {
        const notifTitle = isFromRequest ? 'Donor da huy don' : 'Donor da giai phong don';
        const notifBody = isFromRequest
            ? `Donor huy don "${donation.title}" vi qua 30 phut chua duoc lay. Request cua ban da duoc mo lai.`
            : `Donor huy ket noi voi don "${donation.title}" vi qua 30 phut chua duoc lay.`;
        const notifType = isFromRequest ? 'FOOD_REQUEST_REOPENED' : 'DONATION_RECEIVER_RELEASED';

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

    // Archive conversations chỉ khi donation thật sự kết thúc (từ food request).
    // Nhánh B: donation về PENDING — chat vẫn nên còn cho receiver tiếp theo,
    // nhưng các participant cũ (receiver/volunteer được release) không còn dính
    // tới donation nữa. Archive luôn cho gọn.
    await archiveDonationConversations(donation._id);

    return {
        message: isFromRequest
            ? 'Đã huỷ đơn và mở lại food request cho donor khác accept.'
            : 'Đã giải phóng receiver. Đơn sẵn sàng cho receiver khác.',
        from_food_request: isFromRequest,
    };
}

module.exports = {
    createDonation,
    cancelDonationByDonor,
    releaseReceiverByDonor,
    computeReleaseReceiverEligibility,
    STALE_PICKUP_MS,
};
