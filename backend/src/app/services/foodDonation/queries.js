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
const DonorProfile = require('../../models/donorProfileModel');
const VolunteerProfile = require('../../models/volunteerProfileModel');
const Feedback = require('../../models/feedbackModel');
const { distanceKm, getRoadDistancesFromGoogle, getViewerLocation, isValidCoord } = require('./distance');
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
        query.rejected_by = { $nin: [viewer.id] };
        query.selected_receiver_id = { $ne: null };
        query.delivery_type = 'VIA_AGENT';
    }

    const donations = await FoodDonation.find(query)
        .sort({ createdAt: -1 })
        .populate('donor_id', 'full_name avatar_url')
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

    const distanceCandidates = [];
    if (viewerLocation) {
        donations.forEach((d) => {
            const profile = profileMap[d.donor_id?._id?.toString()];
            if (!isValidCoord(profile?.latitude, profile?.longitude)) return;
            distanceCandidates.push({
                id: d._id.toString(),
                latitude: profile.latitude,
                longitude: profile.longitude,
            });
        });
    }

    const googleDistanceMap = await getRoadDistancesFromGoogle(viewerLocation, distanceCandidates);

    let enriched = donations.map((d) => {
        const profile = profileMap[d.donor_id?._id?.toString()];

        let pickup_distance_km = null;
        if (viewerLocation && isValidCoord(profile?.latitude, profile?.longitude)) {
            pickup_distance_km =
                googleDistanceMap?.get(d._id.toString()) ??
                distanceKm(
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
    });

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

// ── GET /api/food-donations/:id ─────────────────────────────────────────────
// Lấy chi tiết 1 đơn (full images + description + donor info + pickup address).
async function getDonationById(donationId, viewer = null) {
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
    const viewerLocation = await getViewerLocation(viewer);
    if (viewerLocation && isValidCoord(donorProfile?.latitude, donorProfile?.longitude)) {
        const candidates = [{
            id: String(donation._id),
            latitude: donorProfile.latitude,
            longitude: donorProfile.longitude,
        }];
        const googleMap = await getRoadDistancesFromGoogle(viewerLocation, candidates);
        pickup_distance_km =
            googleMap?.get(String(donation._id)) ??
            distanceKm(viewerLocation.latitude, viewerLocation.longitude, donorProfile.latitude, donorProfile.longitude);
    }

    const donorHasValidCoord = isValidCoord(donorProfile?.latitude, donorProfile?.longitude);
    return {
        ...donation,
        pickup_address_line: donorProfile?.address_line ?? null,
        pickup_city:         donorProfile?.city         ?? null,
        pickup_latitude:     donorHasValidCoord ? donorProfile.latitude  : null,
        pickup_longitude:    donorHasValidCoord ? donorProfile.longitude : null,
        pickup_distance_km,
    };
}

module.exports = {
    getDonations,
    getDonationById,
    getMyDonations,
    getVolunteerSummary,
    getMyVolunteerDeliveries,
    getReceiverTracking,
};
