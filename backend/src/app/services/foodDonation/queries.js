/**
 * Read queries — list donations, my donations, tracking, available volunteers,
 * volunteer summary, my deliveries.
 *
 * Tách khỏi action services vì chỉ đọc (không thay đổi state) và logic enrich
 * (distance, profiles, aggregate) khá dài.
 */

const FoodDonation = require('../../models/foodDonationModel');
const FoodRequest = require('../../models/foodRequestModel');
const Delivery = require('../../models/deliveryModel');
const User = require('../../models/userModel');
const DonorProfile = require('../../models/donorProfileModel');
const VolunteerProfile = require('../../models/volunteerProfileModel');
const Feedback = require('../../models/feedbackModel');
const { roadDistanceKm, getViewerLocation, isValidCoord } = require('./distance');
const { computeReleaseReceiverEligibility } = require('./donorActions');

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

// ── GET /api/food-donations ─────────────────────────────────────────────────
// Trả về kèm thông tin donor + địa chỉ pickup. Sort theo distance (gần nhất trước).
// `viewerLocationOverride` cho phép truyền GPS real-time từ mobile thay vì
// dùng toạ độ tĩnh ở profile.
async function getDonations(viewer = null, filter = {}, viewerLocationOverride = null) {
    const query = { ...filter };

    if (viewer?.role === 'RECEIVER' && viewer?.id) {
        query.status = query.status || { $in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] };
        query.$or = [
            { selected_receiver_id: null },
            { selected_receiver_id: viewer.id },
        ];
    } else if (viewer?.role === 'ADMIN') {
        if (!query.status) delete query.status;
    } else {
        query.status = query.status || 'PENDING';
    }

    if (viewer?.role === 'VOLUNTEER' && viewer?.id) {
        // Volunteer offline (is_active = false) thì không nhận đơn nào trong list,
        // đồng bộ với broadcast push (chỉ gửi cho is_active = true).
        const volunteerProfile = await VolunteerProfile.findOne({ user_id: viewer.id })
            .select('is_active')
            .lean();
        if (!volunteerProfile?.is_active) {
            return [];
        }

        query.rejected_by = { $nin: [viewer.id] };
        query.selected_receiver_id = { $ne: null };
        query.delivery_type = 'VIA_AGENT';
    }

    const donations = await FoodDonation.find(query)
        .sort({ createdAt: -1 })
        .populate('donor_id', 'full_name avatar_url')
        .populate('volunteer_id', 'full_name')
        .lean();

    const donorIds = [...new Set(donations.map(d => d.donor_id?._id?.toString()))].filter(Boolean);
    const profiles = await DonorProfile.find({ user_id: { $in: donorIds } })
        .select('user_id address_line city latitude longitude')
        .lean();
    const profileMap = Object.fromEntries(profiles.map(p => [p.user_id.toString(), p]));

    const viewerLocation =
        (viewerLocationOverride && isValidCoord(viewerLocationOverride.latitude, viewerLocationOverride.longitude))
            ? viewerLocationOverride
            : await getViewerLocation(viewer);

    let enriched = await Promise.all(donations.map(async (d) => {
        const profile = profileMap[d.donor_id?._id?.toString()];

        let pickup_distance_km = null;
        if (viewerLocation && isValidCoord(profile?.latitude, profile?.longitude)) {
            pickup_distance_km = await roadDistanceKm(
                viewerLocation.latitude,
                viewerLocation.longitude,
                profile.latitude,
                profile.longitude,
            );
        }

        return {
            ...d,
            pickup_address_line: profile?.address_line ?? null,
            pickup_city:         profile?.city         ?? null,
            pickup_latitude:     isValidCoord(profile?.latitude, profile?.longitude) ? profile.latitude  : null,
            pickup_longitude:    isValidCoord(profile?.latitude, profile?.longitude) ? profile.longitude : null,
            pickup_distance_km,
        };
    }));

    if (viewer?.role === 'VOLUNTEER' && viewer?.id) {
        // Sắp xếp theo khoảng cách tăng dần (gần nhất trước), tie-break theo
        // createdAt mới nhất. Ai accept trước thì thắng (atomic guard ở backend).
        enriched.sort((a, b) => {
            if (a.pickup_distance_km == null && b.pickup_distance_km != null) return 1;
            if (a.pickup_distance_km != null && b.pickup_distance_km == null) return -1;
            if (a.pickup_distance_km != null && b.pickup_distance_km != null && a.pickup_distance_km !== b.pickup_distance_km) {
                return a.pickup_distance_km - b.pickup_distance_km;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    if (viewer?.role === 'RECEIVER') {
        enriched.sort((a, b) => {
            if (a.pickup_distance_km == null && b.pickup_distance_km == null) return 0;
            if (a.pickup_distance_km == null) return 1;
            if (b.pickup_distance_km == null) return -1;
            return a.pickup_distance_km - b.pickup_distance_km;
        });
    }

    return enriched;
}

// ── GET /api/food-donations/my ──────────────────────────────────────────────
async function getMyDonations(donorId) {
    const donations = await FoodDonation.find({ donor_id: donorId })
        .sort({ createdAt: -1 })
        .populate('selected_receiver_id', 'full_name avatar_url phone_number')
        .lean();

    // Gắn pickup_code + delivery_status cho donor (cần đọc code cho volunteer khi VIA_AGENT).
    const deliveryIds = donations.map((d) => d.delivery_id).filter(Boolean);
    const deliveries = deliveryIds.length > 0
        ? await Delivery.find({ _id: { $in: deliveryIds } })
            .select('_id pickup_code status createdAt')
            .lean()
        : [];
    const deliveryMap = Object.fromEntries(deliveries.map((d) => [String(d._id), d]));

    // Mark đơn nào tạo từ FoodRequest — UI hiển thị wording khác lúc release.
    const donationIds = donations.map((d) => d._id);
    const linkedRequests = donationIds.length > 0
        ? await FoodRequest.find({ linked_donation_id: { $in: donationIds } })
            .select('linked_donation_id')
            .lean()
        : [];
    const fromRequestSet = new Set(linkedRequests.map((r) => String(r.linked_donation_id)));

    return donations.map((d) => {
        const delivery = d.delivery_id ? deliveryMap[String(d.delivery_id)] : null;
        const eligibility = computeReleaseReceiverEligibility(d, delivery);
        return {
            ...d,
            pickup_code: delivery?.pickup_code ?? null,
            delivery_status: delivery?.status ?? null,
            selected_at: eligibility.selectedAt,
            release_eligible_at: eligibility.releaseEligibleAt,
            can_release_receiver: eligibility.canRelease,
            release_state: eligibility.reason,
            from_food_request: fromRequestSet.has(String(d._id)),
        };
    });
}

// ── GET /api/food-donations/received ────────────────────────────────────────
// Lịch sử các đơn receiver đã nhận thành công (status COMPLETED). Dùng cho phần
// "Hoạt động của tôi" của receiver. limit > 0 để lấy N đơn gần nhất.
async function getMyReceivedDonations(receiverId, limit = 0) {
    let q = FoodDonation.find({ selected_receiver_id: receiverId, status: 'COMPLETED' })
        .select('title quantity unit food_type images status donor_id createdAt updatedAt')
        .populate('donor_id', 'full_name avatar_url')
        .sort({ updatedAt: -1, createdAt: -1 });
    if (limit > 0) q = q.limit(limit);
    const donations = await q.lean();

    return donations.map((d) => ({
        _id: d._id,
        title: d.title,
        quantity: d.quantity,
        unit: d.unit,
        food_type: d.food_type,
        images: d.images || [],
        status: d.status,
        donor_name: d.donor_id?.full_name ?? null,
        donor_avatar_url: d.donor_id?.avatar_url ?? null,
        received_at: d.updatedAt ?? d.createdAt,
        createdAt: d.createdAt,
    }));
}

// ── GET /api/food-donations/volunteer/delivered ─────────────────────────────
// Lịch sử các đơn volunteer đã giao thành công (donation status COMPLETED ⇔
// delivery DELIVERED). Đối xứng với getMyReceivedDonations của receiver.
async function getMyVolunteerDeliveryHistory(volunteerId, limit = 0) {
    let q = FoodDonation.find({
        volunteer_id: volunteerId,
        delivery_type: 'VIA_AGENT',
        status: 'COMPLETED',
    })
        .select('title quantity unit food_type images status donor_id selected_receiver_id createdAt updatedAt')
        .populate('donor_id', 'full_name avatar_url')
        .populate('selected_receiver_id', 'full_name avatar_url')
        .sort({ updatedAt: -1, createdAt: -1 });
    if (limit > 0) q = q.limit(limit);
    const donations = await q.lean();

    return donations.map((d) => ({
        _id: d._id,
        title: d.title,
        quantity: d.quantity,
        unit: d.unit,
        food_type: d.food_type,
        images: d.images || [],
        status: d.status,
        donor_name: d.donor_id?.full_name ?? null,
        receiver_name: d.selected_receiver_id?.full_name ?? null,
        receiver_avatar_url: d.selected_receiver_id?.avatar_url ?? null,
        delivered_at: d.updatedAt ?? d.createdAt,
        createdAt: d.createdAt,
    }));
}

// ── GET /api/food-donations/volunteer/summary ───────────────────────────────
async function getVolunteerSummary(volunteerId) {
    const [delivered_count, feedback_count] = await Promise.all([
        Delivery.countDocuments({ volunteer_id: volunteerId, status: 'DELIVERED' }),
        Feedback.countDocuments({ to_user_id: volunteerId }),
    ]);

    return {
        delivered_count,
        feedback_count,
    };
}

// ── GET /api/food-donations/volunteer/my-deliveries ─────────────────────────
async function getMyVolunteerDeliveries(volunteerId) {
    const donations = await FoodDonation.find({
        volunteer_id: volunteerId,
        delivery_type: 'VIA_AGENT',
        status: { $in: ['ACCEPTED', 'PICKED_UP'] },
    })
        .select('title quantity unit status donor_id selected_receiver_id delivery_id createdAt')
        .populate('donor_id', 'full_name phone_number avatar_url')
        .populate('selected_receiver_id', 'full_name phone_number avatar_url')
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

    if (donations.length === 0) return [];

    const donorIds = [...new Set(donations.map((d) => d.donor_id?._id?.toString()))].filter(Boolean);
    const profiles = await DonorProfile.find({ user_id: { $in: donorIds } })
        .select('user_id address_line city latitude longitude')
        .lean();
    const profileMap = Object.fromEntries(profiles.map((p) => [p.user_id.toString(), p]));

    const deliveryIds = donations.map((d) => d.delivery_id).filter(Boolean);
    const deliveries = await Delivery.find({ _id: { $in: deliveryIds } })
        .select('_id status assigned_at picked_up_at delivered_at')
        .lean();
    const deliveryMap = Object.fromEntries(deliveries.map((d) => [d._id.toString(), d]));

    return donations.map((d) => {
        const donorProfile = profileMap[d.donor_id?._id?.toString()] || null;
        const delivery = d.delivery_id ? deliveryMap[d.delivery_id.toString()] : null;

        return {
            id: d._id,
            title: d.title,
            quantity: d.quantity,
            unit: d.unit,
            status: d.status,
            delivery_id: d.delivery_id || null,
            delivery_status: delivery?.status || null,
            assigned_at: delivery?.assigned_at || null,
            picked_up_at: delivery?.picked_up_at || null,
            delivered_at: delivery?.delivered_at || null,
            donor: {
                id: d.donor_id?._id || null,
                full_name: d.donor_id?.full_name || 'Donor',
                phone_number: d.donor_id?.phone_number || null,
                avatar_url: d.donor_id?.avatar_url || null,
            },
            receiver: {
                id: d.selected_receiver_id?._id || null,
                full_name: d.selected_receiver_id?.full_name || 'Receiver',
                phone_number: d.selected_receiver_id?.phone_number || null,
                avatar_url: d.selected_receiver_id?.avatar_url || null,
            },
            pickup_address_line: donorProfile?.address_line || null,
            pickup_city: donorProfile?.city || null,
            pickup_latitude: donorProfile?.latitude ?? null,
            pickup_longitude: donorProfile?.longitude ?? null,
        };
    });
}


// ── GET /api/food-donations/:id/tracking ────────────────────────────────────
async function getReceiverTracking(donationId, receiverId) {
    const donation = await FoodDonation.findById(donationId)
        .populate('donor_id', 'full_name phone_number avatar_url')
        .lean();

    if (!donation) {
        throw _error('Không tìm thấy đơn quyên góp.', 404);
    }

    if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
        throw _error('Bạn không có quyền xem tracking của đơn này.', 403);
    }

    if (!donation.delivery_id) {
        throw _error('Đơn này chưa có thông tin vận chuyển.', 404);
    }

    const delivery = await Delivery.findById(donation.delivery_id)
        .populate('volunteer_id', 'full_name phone_number avatar_url')
        .lean();

    if (!delivery) {
        throw _error('Không tìm thấy delivery cho đơn này.', 404);
    }

    const donorProfile = await DonorProfile.findOne({ user_id: donation.donor_id?._id || donation.donor_id })
        .select('address_line city latitude longitude')
        .lean();

    const linkedRequest = await FoodRequest.findOne({ linked_donation_id: donation._id })
        .select('_id')
        .lean();

    return {
        donation: {
            id: donation._id,
            title: donation.title,
            status: donation.status,
            quantity: donation.quantity,
            unit: donation.unit,
            delivery_type: donation.delivery_type,
            from_food_request: Boolean(linkedRequest),
        },
        delivery: {
            id: delivery._id,
            status: delivery.status,
            delivery_type: delivery.delivery_type,
            assigned_at: delivery.assigned_at,
            picked_up_at: delivery.picked_up_at,
            delivered_at: delivery.delivered_at,
        },
        donor: {
            id: donation.donor_id?._id || donation.donor_id,
            full_name: donation.donor_id?.full_name || 'Donor',
            phone_number: donation.donor_id?.phone_number || null,
            avatar_url: donation.donor_id?.avatar_url || null,
            address_line: donorProfile?.address_line || null,
            city: donorProfile?.city || null,
            latitude: donorProfile?.latitude ?? null,
            longitude: donorProfile?.longitude ?? null,
        },
        volunteer: delivery.volunteer_id
            ? {
                id: delivery.volunteer_id?._id,
                full_name: delivery.volunteer_id?.full_name || 'Volunteer',
                phone_number: delivery.volunteer_id?.phone_number || null,
                avatar_url: delivery.volunteer_id?.avatar_url || null,
            }
            : null,
    };
}

// ── GET /api/food-donations/:id/volunteer-delivery ──────────────────────────
// Chi tiết 1 đơn mà volunteer đã/đang phụ trách (dùng cho màn lịch sử giao hàng).
// Trả về donor (kèm địa chỉ lấy hàng), receiver và mốc thời gian giao.
async function getVolunteerDeliveryDetail(donationId, volunteerId) {
    const donation = await FoodDonation.findById(donationId)
        .populate('donor_id', 'full_name phone_number avatar_url')
        .populate('selected_receiver_id', 'full_name phone_number avatar_url')
        .lean();

    if (!donation) {
        throw _error('Không tìm thấy đơn quyên góp.', 404);
    }

    if (!donation.volunteer_id || donation.volunteer_id.toString() !== volunteerId.toString()) {
        throw _error('Bạn không có quyền xem đơn này.', 403);
    }

    const delivery = donation.delivery_id
        ? await Delivery.findById(donation.delivery_id)
            .select('status assigned_at picked_up_at delivered_at')
            .lean()
        : null;

    const donorObjectId = donation.donor_id?._id || donation.donor_id;
    const donorProfile = donorObjectId
        ? await DonorProfile.findOne({ user_id: donorObjectId })
            .select('address_line city latitude longitude')
            .lean()
        : null;

    return {
        donation: {
            id: donation._id,
            title: donation.title,
            status: donation.status,
            quantity: donation.quantity,
            unit: donation.unit,
            food_type: donation.food_type,
            images: donation.images || [],
        },
        delivery: delivery
            ? {
                status: delivery.status,
                assigned_at: delivery.assigned_at,
                picked_up_at: delivery.picked_up_at,
                delivered_at: delivery.delivered_at,
            }
            : null,
        donor: {
            id: donorObjectId,
            full_name: donation.donor_id?.full_name || 'Donor',
            phone_number: donation.donor_id?.phone_number || null,
            avatar_url: donation.donor_id?.avatar_url || null,
            address_line: donorProfile?.address_line || null,
            city: donorProfile?.city || null,
            latitude: donorProfile?.latitude ?? null,
            longitude: donorProfile?.longitude ?? null,
        },
        receiver: donation.selected_receiver_id
            ? {
                id: donation.selected_receiver_id?._id,
                full_name: donation.selected_receiver_id?.full_name || 'Receiver',
                phone_number: donation.selected_receiver_id?.phone_number || null,
                avatar_url: donation.selected_receiver_id?.avatar_url || null,
            }
            : null,
    };
}

// ── GET /api/food-donations/:id ─────────────────────────────────────────────
// Lấy chi tiết 1 đơn (full images + description + donor info + pickup address).
async function getDonationById(donationId, viewer = null, viewerLocationOverride = null) {
    const donation = await FoodDonation.findById(donationId)
        .populate('donor_id', 'full_name avatar_url phone_number')
        .lean();

    if (!donation) {
        throw _error('Không tìm thấy đơn quyên góp.', 404);
    }

    const donorObjectId = donation.donor_id?._id || donation.donor_id;
    const donorProfile = donorObjectId
        ? await DonorProfile.findOne({ user_id: donorObjectId })
            .select('address_line city latitude longitude')
            .lean()
        : null;

    let pickup_distance_km = null;
    const viewerLocation =
        (viewerLocationOverride && isValidCoord(viewerLocationOverride.latitude, viewerLocationOverride.longitude))
            ? viewerLocationOverride
            : await getViewerLocation(viewer);
    if (viewerLocation && isValidCoord(donorProfile?.latitude, donorProfile?.longitude)) {
        pickup_distance_km =
            await roadDistanceKm(viewerLocation.latitude, viewerLocation.longitude, donorProfile.latitude, donorProfile.longitude);
    }

    // Chủ đơn (donor) xem chi tiết: kèm thông tin người nhận đã ghép + mã lấy
    // hàng để đọc cho volunteer. Chỉ owner mới thấy để tránh lộ thông tin
    // receiver cho người dùng khác fetch theo id.
    const isOwner = viewer?.id && donorObjectId && String(donorObjectId) === String(viewer.id);

    // SĐT donor chỉ lộ cho người trong đơn (owner / receiver đã chốt / volunteer
    // đã gán). Receiver đang cân nhắc connect KHÔNG được thấy số — tránh lộ/spam.
    const viewerId = viewer?.id ? String(viewer.id) : null;
    const isSelectedReceiver = Boolean(viewerId && donation.selected_receiver_id
        && String(donation.selected_receiver_id) === viewerId);
    const isAssignedVolunteer = Boolean(viewerId && donation.volunteer_id
        && String(donation.volunteer_id) === viewerId);
    const canSeeDonorContact = Boolean(isOwner) || isSelectedReceiver || isAssignedVolunteer;

    let selected_receiver = null;
    let pickup_code = null;
    let delivery_status = null;
    if (isOwner) {
        if (donation.selected_receiver_id) {
            selected_receiver = await User.findById(donation.selected_receiver_id)
                .select('full_name avatar_url phone_number')
                .lean();
        }
        if (donation.delivery_id) {
            const delivery = await Delivery.findById(donation.delivery_id)
                .select('pickup_code status')
                .lean();
            pickup_code = delivery?.pickup_code ?? null;
            delivery_status = delivery?.status ?? null;
        }
    }

    const donorHasValidCoord = isValidCoord(donorProfile?.latitude, donorProfile?.longitude);

    let donor_id = donation.donor_id;
    if (!canSeeDonorContact && donor_id && typeof donor_id === 'object') {
        const { phone_number, ...donorPublic } = donor_id;
        donor_id = donorPublic;
    }

    return {
        ...donation,
        donor_id,
        pickup_address_line: donorProfile?.address_line ?? null,
        pickup_city:         donorProfile?.city         ?? null,
        pickup_latitude:     donorHasValidCoord ? donorProfile.latitude  : null,
        pickup_longitude:    donorHasValidCoord ? donorProfile.longitude : null,
        pickup_distance_km,
        selected_receiver,
        pickup_code,
        delivery_status,
    };
}

module.exports = {
    getDonations,
    getDonationById,
    getMyDonations,
    getMyReceivedDonations,
    getMyVolunteerDeliveryHistory,
    getVolunteerDeliveryDetail,
    getVolunteerSummary,
    getMyVolunteerDeliveries,
    getReceiverTracking,
};
