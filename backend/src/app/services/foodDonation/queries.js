/**
 * Read queries — list donations, my donations, tracking, available volunteers,
 * volunteer summary, my deliveries.
 *
 * Tách khỏi action services vì chỉ đọc (không thay đổi state) và logic enrich
 * (distance, profiles, aggregate) khá dài.
 */

const FoodDonation = require('../../models/foodDonationModel');
const Delivery = require('../../models/deliveryModel');
const DonorProfile = require('../../models/donorProfileModel');
const VolunteerProfile = require('../../models/volunteerProfileModel');
const Feedback = require('../../models/feedbackModel');
const { distanceKm, getRoadDistancesFromGoogle, getViewerLocation } = require('./distance');

function _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
}

// ── GET /api/food-donations ─────────────────────────────────────────────────
// Trả về kèm thông tin donor + địa chỉ pickup. Sort theo distance / preferred volunteer.
async function getDonations(viewer = null, filter = {}) {
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

    const viewerLocation = await getViewerLocation(viewer);

    const distanceCandidates = [];
    if (viewerLocation) {
        donations.forEach((d) => {
            const profile = profileMap[d.donor_id?._id?.toString()];
            if (profile?.latitude == null || profile?.longitude == null) return;
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
        if (viewerLocation && profile?.latitude != null && profile?.longitude != null) {
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
            pickup_latitude:     profile?.latitude     ?? null,
            pickup_longitude:    profile?.longitude    ?? null,
            pickup_distance_km,
        };
    });

    if (viewer?.role === 'VOLUNTEER' && viewer?.id) {
        const donationIds = enriched.map((item) => item._id).filter(Boolean);
        const deliveries = donationIds.length > 0
            ? await Delivery.find({ donation_id: { $in: donationIds } })
                .select('donation_id preferred_volunteer_id')
                .lean()
            : [];

        const preferredMap = new Map(
            deliveries.map((item) => [
                String(item.donation_id),
                item.preferred_volunteer_id ? String(item.preferred_volunteer_id) : null,
            ]),
        );

        const viewerId = String(viewer.id);
        enriched = enriched.map((item) => {
            const preferredVolunteerId = preferredMap.get(String(item._id)) || null;
            return {
                ...item,
                preferred_volunteer_id: preferredVolunteerId,
                is_preferred_for_you: preferredVolunteerId === viewerId,
            };
        });

        enriched.sort((a, b) => {
            const aPreferred = a.is_preferred_for_you ? 1 : 0;
            const bPreferred = b.is_preferred_for_you ? 1 : 0;
            if (aPreferred !== bPreferred) return bPreferred - aPreferred;

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
    if (deliveryIds.length === 0) return donations;

    const deliveries = await Delivery.find({ _id: { $in: deliveryIds } })
        .select('_id pickup_code status')
        .lean();
    const deliveryMap = Object.fromEntries(deliveries.map((d) => [String(d._id), d]));

    return donations.map((d) => {
        const delivery = d.delivery_id ? deliveryMap[String(d.delivery_id)] : null;
        return {
            ...d,
            pickup_code: delivery?.pickup_code ?? null,
            delivery_status: delivery?.status ?? null,
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

// ── GET /api/food-donations/:id/available-volunteers ────────────────────────
// Receiver xem danh sách volunteer khả dụng để chọn preferred trước khi chooseDelivery.
async function getAvailableVolunteersForDonation(donationId, receiverId, limit = 20) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));

    const donation = await FoodDonation.findById(donationId).lean();
    if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

    if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
        throw _error('Bạn chưa được donor chốt cho đơn này.', 403);
    }

    const donorProfile = await DonorProfile.findOne({ user_id: donation.donor_id })
        .select('latitude longitude')
        .lean();

    const volunteerProfiles = await VolunteerProfile.find()
        .select('user_id city latitude longitude verification_status')
        .populate({
            path: 'user_id',
            select: 'full_name avatar_url role profile_completed',
            match: { role: 'VOLUNTEER', profile_completed: true },
        })
        .lean();

    const volunteers = volunteerProfiles.filter((v) => v.user_id);
    if (volunteers.length === 0) {
        return { donation_id: donation._id, volunteers: [] };
    }

    const volunteerIds = volunteers.map((v) => v.user_id._id);

    const [deliveredAgg, ratingAgg] = await Promise.all([
        Delivery.aggregate([
            { $match: { volunteer_id: { $in: volunteerIds }, status: 'DELIVERED' } },
            { $group: { _id: '$volunteer_id', completed_pickup: { $sum: 1 } } },
        ]),
        Feedback.aggregate([
            { $match: { to_user_id: { $in: volunteerIds } } },
            { $group: { _id: '$to_user_id', stars: { $avg: '$rating' }, rating_count: { $sum: 1 } } },
        ]),
    ]);

    const completedMap = new Map(
        deliveredAgg.map((item) => [String(item._id), item.completed_pickup || 0]),
    );
    const ratingMap = new Map(
        ratingAgg.map((item) => [
            String(item._id),
            {
                stars: item.stars != null ? Number(item.stars.toFixed(1)) : 0,
                rating_count: item.rating_count || 0,
            },
        ]),
    );

    const donorLocation =
        donorProfile?.latitude != null && donorProfile?.longitude != null
            ? { latitude: donorProfile.latitude, longitude: donorProfile.longitude }
            : null;

    const distanceCandidates = donorLocation
        ? volunteers
            .filter((v) => v.latitude != null && v.longitude != null)
            .map((v) => ({
                id: String(v.user_id._id),
                latitude: v.latitude,
                longitude: v.longitude,
            }))
        : [];

    const googleDistanceMap = await getRoadDistancesFromGoogle(donorLocation, distanceCandidates);

    const volunteerItems = volunteers.map((v) => {
        const id = String(v.user_id._id);
        const ratingInfo = ratingMap.get(id) || { stars: 0, rating_count: 0 };

        let distance_km = null;
        if (donorLocation && v.latitude != null && v.longitude != null) {
            distance_km =
                googleDistanceMap?.get(id) ??
                distanceKm(donorLocation.latitude, donorLocation.longitude, v.latitude, v.longitude);
        }

        return {
            id,
            full_name: v.user_id.full_name || 'Volunteer',
            avatar_url: v.user_id.avatar_url || null,
            city: v.city || null,
            distance_km: distance_km != null ? Number(distance_km.toFixed(2)) : null,
            completed_pickup: completedMap.get(id) || 0,
            stars: ratingInfo.stars,
            rating_count: ratingInfo.rating_count,
            verification_status: v.verification_status || 'PENDING',
        };
    });

    volunteerItems.sort((a, b) => {
        if (a.distance_km == null && b.distance_km == null) {
            if (b.completed_pickup !== a.completed_pickup) return b.completed_pickup - a.completed_pickup;
            return b.stars - a.stars;
        }
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        if (a.distance_km !== b.distance_km) return a.distance_km - b.distance_km;
        if (b.completed_pickup !== a.completed_pickup) return b.completed_pickup - a.completed_pickup;
        return b.stars - a.stars;
    });

    return {
        donation_id: donation._id,
        volunteers: volunteerItems.slice(0, safeLimit),
    };
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

    return {
        donation: {
            id: donation._id,
            title: donation.title,
            status: donation.status,
            quantity: donation.quantity,
            unit: donation.unit,
            delivery_type: donation.delivery_type,
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

module.exports = {
    getDonations,
    getMyDonations,
    getVolunteerSummary,
    getMyVolunteerDeliveries,
    getAvailableVolunteersForDonation,
    getReceiverTracking,
};
