const FoodDonation  = require('../models/foodDonationModel');
const Delivery = require('../models/deliveryModel');
const DonorProfile = require('../models/donorProfileModel');
const ReceiverProfile = require('../models/receiverProfileModel');
const VolunteerProfile = require('../models/volunteerProfileModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const Feedback = require('../models/feedbackModel');
const NotificationService = require('./notificationService');

class FoodDonationService {

    static _error(message, statusCode = 400) {
        return Object.assign(new Error(message), { statusCode });
    }

    static _toRad(value) {
        return (value * Math.PI) / 180;
    }

    static _distanceKm(lat1, lon1, lat2, lon2) {
        const earthRadiusKm = 6371;
        const dLat = this._toRad(lat2 - lat1);
        const dLon = this._toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    static async _getRoadDistancesFromGoogle(origin, destinations) {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_DISTANCE_MATRIX_API_KEY;
        if (!apiKey) return null;
        if (!origin || destinations.length === 0) return null;

        const originParam = `${origin.latitude},${origin.longitude}`;
        const destinationParam = destinations
            .map((d) => `${d.latitude},${d.longitude}`)
            .join('|');

        const url =
            'https://maps.googleapis.com/maps/api/distancematrix/json' +
            `?origins=${encodeURIComponent(originParam)}` +
            `&destinations=${encodeURIComponent(destinationParam)}` +
            '&mode=driving&language=vi&units=metric' +
            `&key=${encodeURIComponent(apiKey)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) return null;

            const payload = await response.json();
            if (payload?.status !== 'OK') return null;

            const elements = payload?.rows?.[0]?.elements;
            if (!Array.isArray(elements)) return null;

            const resultMap = new Map();
            destinations.forEach((dest, idx) => {
                const element = elements[idx];
                if (element?.status !== 'OK') return;

                const meters = element?.distance?.value;
                if (typeof meters !== 'number') return;

                resultMap.set(dest.id, meters / 1000);
            });

            return resultMap;
        } catch {
            return null;
        }
    }

    static async _getViewerLocation(viewer = null) {
        if (!viewer?.id || !viewer?.role) return null;

        if (viewer.role === 'DONOR') {
            const donor = await DonorProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
            if (donor?.latitude == null || donor?.longitude == null) return null;
            return { latitude: donor.latitude, longitude: donor.longitude };
        }

        if (viewer.role === 'RECEIVER') {
            const receiver = await ReceiverProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
            if (receiver?.latitude == null || receiver?.longitude == null) return null;
            return { latitude: receiver.latitude, longitude: receiver.longitude };
        }

        if (viewer.role === 'VOLUNTEER') {
            const volunteer = await VolunteerProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
            if (volunteer?.latitude == null || volunteer?.longitude == null) return null;
            return { latitude: volunteer.latitude, longitude: volunteer.longitude };
        }

        return null;
    }

    // ── POST /api/food-donations ────────────────────────────────────────────
    static async createDonation(donorId, data) {
        const {
            title, description,
            food_type, food_preference,
            quantity, unit,
            expiration_datetime,
        } = data;

        if (!title)                    throw this._error('title là bắt buộc.');
        if (!food_type)                throw this._error('food_type là bắt buộc.');
        if (!quantity || quantity < 1) throw this._error('quantity phải >= 1.');
        if (!expiration_datetime)      throw this._error('expiration_datetime là bắt buộc.');

        const VALID_FOOD_TYPE = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];
        if (!VALID_FOOD_TYPE.includes(food_type)) {
            throw this._error(`food_type không hợp lệ. Các giá trị hợp lệ: ${VALID_FOOD_TYPE.join(', ')}`);
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

    // ── GET /api/food-donations ─────────────────────────────────────────────
    // Trả về kèm thông tin donor + địa chỉ pickup từ DonorProfile
    static async getDonations(viewer = null, filter = {}) {
        const query = { ...filter };

        if (viewer?.role === 'RECEIVER' && viewer?.id) {
            query.status = query.status || { $in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] };
            // Receiver chỉ thấy đơn chưa chốt hoặc đã chốt cho chính họ.
            query.$or = [
                { selected_receiver_id: null },
                { selected_receiver_id: viewer.id },
            ];
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

        // Gắn địa chỉ pickup từ DonorProfile vào từng donation
        const donorIds = [...new Set(donations.map(d => d.donor_id?._id?.toString()))].filter(Boolean);
        const profiles = await DonorProfile.find({ user_id: { $in: donorIds } })
            .select('user_id address_line city latitude longitude')
            .lean();
        const profileMap = Object.fromEntries(profiles.map(p => [p.user_id.toString(), p]));

        const viewerLocation = await this._getViewerLocation(viewer);

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

        const googleDistanceMap = await this._getRoadDistancesFromGoogle(viewerLocation, distanceCandidates);

        let enriched = donations.map(d => {
            const profile = profileMap[d.donor_id?._id?.toString()];

            let pickup_distance_km = null;
            if (viewerLocation && profile?.latitude != null && profile?.longitude != null) {
                pickup_distance_km =
                    googleDistanceMap?.get(d._id.toString()) ??
                    this._distanceKm(
                        viewerLocation.latitude,
                        viewerLocation.longitude,
                        profile.latitude,
                        profile.longitude
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

    // ── GET /api/food-donations/my ──────────────────────────────────────────
    static async getMyDonations(donorId) {
        return FoodDonation.find({ donor_id: donorId })
            .sort({ createdAt: -1 })
            .populate('interested_receivers', 'full_name avatar_url phone_number')
            .populate('selected_receiver_id', 'full_name avatar_url phone_number');
    }

    // ── GET /api/food-donations/volunteer/my-deliveries ──────────────────
    static async getMyVolunteerDeliveries(volunteerId) {
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

    // ── GET /api/food-donations/:id/available-volunteers ─────────────────
    static async getAvailableVolunteersForDonation(donationId, receiverId, limit = 20) {
        const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));

        const donation = await FoodDonation.findById(donationId).lean();
        if (!donation) throw this._error('Không tìm thấy đơn quyên góp.', 404);

        if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
            throw this._error('Bạn chưa được donor chốt cho đơn này.', 403);
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
            return {
                donation_id: donation._id,
                volunteers: [],
            };
        }

        const volunteerIds = volunteers.map((v) => v.user_id._id);

        const [deliveredAgg, ratingAgg] = await Promise.all([
            Delivery.aggregate([
                {
                    $match: {
                        volunteer_id: { $in: volunteerIds },
                        status: 'DELIVERED',
                    },
                },
                {
                    $group: {
                        _id: '$volunteer_id',
                        completed_pickup: { $sum: 1 },
                    },
                },
            ]),
            Feedback.aggregate([
                {
                    $match: {
                        to_user_id: { $in: volunteerIds },
                    },
                },
                {
                    $group: {
                        _id: '$to_user_id',
                        stars: { $avg: '$rating' },
                        rating_count: { $sum: 1 },
                    },
                },
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

        const googleDistanceMap = await this._getRoadDistancesFromGoogle(donorLocation, distanceCandidates);

        const volunteerItems = volunteers.map((v) => {
            const id = String(v.user_id._id);
            const ratingInfo = ratingMap.get(id) || { stars: 0, rating_count: 0 };

            let distance_km = null;
            if (donorLocation && v.latitude != null && v.longitude != null) {
                distance_km =
                    googleDistanceMap?.get(id) ??
                    this._distanceKm(donorLocation.latitude, donorLocation.longitude, v.latitude, v.longitude);
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

    // ── PATCH /api/food-donations/:id/connect ─────────────────────────────
    static async connectDonationByReceiver(donationId, receiverId) {
        const donation = await FoodDonation.findById(donationId)
            .populate('donor_id', 'full_name')
            .lean();

        if (!donation) {
            throw this._error('Đơn quyên góp không tồn tại.', 404);
        }

        if (donation.status !== 'PENDING') {
            throw this._error('Đơn này không còn khả dụng để connect.');
        }

        if (donation.selected_receiver_id) {
            throw this._error('Đơn này đã được donor chốt người nhận.');
        }

        const donorId = donation.donor_id?._id?.toString?.() || donation.donor_id?.toString?.();
        if (!donorId) {
            throw this._error('Đơn không hợp lệ: thiếu thông tin donor.', 400);
        }

        if (donorId === receiverId.toString()) {
            throw this._error('Bạn không thể connect đơn của chính mình.');
        }

        const alreadyConnected = (donation.interested_receivers || [])
            .some((id) => id.toString() === receiverId.toString());

        if (alreadyConnected) {
                return {
                    message: 'Bạn đã gửi yêu cầu kết nối trước đó. Vui lòng chờ Donor xác nhận.',
                already_connected: true,
            };
        }

        await FoodDonation.updateOne(
            { _id: donationId },
            { $addToSet: { interested_receivers: receiverId } },
        );

        const receiver = await User.findById(receiverId).select('full_name').lean();
        const receiverName = receiver?.full_name || 'Một receiver';

        // Save in-app notification for donor
        await Notification.create({
            user_id: donorId,
            title: 'Co nguoi muon nhan do an cua ban',
            message: `${receiverName} da connect don "${donation.title}"`,
            type: 'DONATION_INTEREST',
            related_entity_type: 'FoodDonation',
            related_entity_id: donation._id,
        });

        // Best-effort push notification
        await NotificationService.notifyDonorNewOrder(donorId, {
            receiver_name: receiverName,
            quantity: donation.quantity,
            order_id: donation._id.toString(),
        }).catch(() => {});

        return {
                message: 'Đã gửi yêu cầu kết nối. Vui lòng chờ Donor xác nhận.',
            already_connected: false,
        };
    }

    // ── PATCH /api/food-donations/:id/receiver-requests/:receiverId/approve ──
    static async approveReceiverRequest(donationId, donorId, receiverId) {
        const donation = await FoodDonation.findOne({ _id: donationId, donor_id: donorId }).lean();
        if (!donation) throw this._error('Không tìm thấy đơn quyên góp.', 404);
        if (donation.status !== 'PENDING') {
            throw this._error('Chỉ có thể approve khi đơn đang ở trạng thái PENDING.');
        }

        if (donation.selected_receiver_id?.toString?.() === receiverId.toString()) {
            return { message: 'Receiver này đã được approve trước đó.', already_approved: true };
        }

        if (donation.selected_receiver_id && donation.selected_receiver_id.toString() !== receiverId.toString()) {
            throw this._error('Đơn này đã approve một receiver khác.');
        }

        const isInterested = (donation.interested_receivers || [])
            .some((id) => id.toString() === receiverId.toString());

        if (!isInterested) {
            throw this._error('Receiver này chưa connect đơn này hoặc đã bị xử lý.', 404);
        }

        await FoodDonation.updateOne(
            { _id: donationId, donor_id: donorId },
            {
                $set: { selected_receiver_id: receiverId },
                $pull: { interested_receivers: receiverId },
            },
        );

        const donor = await User.findById(donorId).select('full_name').lean();
        const donorName = donor?.full_name || 'Donor';

        await Notification.create({
            user_id: receiverId,
            title: 'Yeu cau nhan do an da duoc chap nhan',
            message: `${donorName} da chap nhan ket noi cho don "${donation.title}"`,
            type: 'DONATION_CONNECT_APPROVED',
            related_entity_type: 'FoodDonation',
            related_entity_id: donation._id,
        });

        await NotificationService.notifyOrderConfirmed(receiverId, {
            donor_name: donorName,
            pickup_time: 'soon',
            order_id: donation._id.toString(),
        }).catch(() => {});

        return { message: 'Approve receiver thanh cong.', already_approved: false };
    }

    // ── PATCH /api/food-donations/:id/receiver-requests/:receiverId/reject ───
    static async rejectReceiverRequest(donationId, donorId, receiverId) {
        const donation = await FoodDonation.findOne({ _id: donationId, donor_id: donorId }).lean();
        if (!donation) throw this._error('Không tìm thấy đơn quyên góp.', 404);
        if (donation.status !== 'PENDING') {
            throw this._error('Chỉ có thể reject khi đơn đang ở trạng thái PENDING.');
        }

        if (donation.selected_receiver_id?.toString?.() === receiverId.toString()) {
            throw this._error('Receiver này đã được approve, không thể reject.');
        }

        const isInterested = (donation.interested_receivers || [])
            .some((id) => id.toString() === receiverId.toString());

        if (!isInterested) {
            return { message: 'Receiver này đã được xử lý trước đó.', already_rejected: true };
        }

        await FoodDonation.updateOne(
            { _id: donationId, donor_id: donorId },
            { $pull: { interested_receivers: receiverId } },
        );

        const donor = await User.findById(donorId).select('full_name').lean();
        const donorName = donor?.full_name || 'Donor';

        await Notification.create({
            user_id: receiverId,
            title: 'Ket noi da bi tu choi',
            message: `${donorName} da tu choi ket noi cho don "${donation.title}"`,
            type: 'DONATION_CONNECT_REJECTED',
            related_entity_type: 'FoodDonation',
            related_entity_id: donation._id,
        });

        await NotificationService.notifyOrderRejected(receiverId, {
            reason: 'Donor tu choi ket noi',
            order_id: donation._id.toString(),
        }).catch(() => {});

        return { message: 'Reject receiver thanh cong.', already_rejected: false };
    }

    // ── PATCH /api/food-donations/:id/receiver-delivery-choice ────────────
    static async chooseDeliveryByReceiver(donationId, receiverId, deliveryType, preferredVolunteerId = null) {
        const VALID_TYPES = ['VIA_AGENT', 'SELF_PICKUP'];
        if (!VALID_TYPES.includes(deliveryType)) {
            throw this._error('delivery_type không hợp lệ. Giá trị hợp lệ: VIA_AGENT, SELF_PICKUP.');
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
                throw this._error('Volunteer được chọn không hợp lệ hoặc chưa sẵn sàng nhận đơn.', 400);
            }
        }

        const donation = await FoodDonation.findById(donationId).lean();
        if (!donation) throw this._error('Không tìm thấy đơn quyên góp.', 404);

        if (donation.status !== 'PENDING') {
            throw this._error('Đơn này không còn ở trạng thái có thể chọn phương thức nhận.');
        }

        if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
            throw this._error('Bạn chưa được donor chốt cho đơn này.', 403);
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

        const delivery = await Delivery.create({
            donation_id: donation._id,
            donor_id: donation.donor_id,
            receiver_id: receiverId,
            delivery_type: deliveryType,
            status: deliveryStatus,
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

    // ── GET /api/food-donations/:id/tracking ───────────────────────────────
    static async getReceiverTracking(donationId, receiverId) {
        const donation = await FoodDonation.findById(donationId)
            .populate('donor_id', 'full_name phone_number avatar_url')
            .lean();

        if (!donation) {
            throw this._error('Không tìm thấy đơn quyên góp.', 404);
        }

        if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
            throw this._error('Bạn không có quyền xem tracking của đơn này.', 403);
        }

        if (!donation.delivery_id) {
            throw this._error('Đơn này chưa có thông tin vận chuyển.', 404);
        }

        const delivery = await Delivery.findById(donation.delivery_id)
            .populate('volunteer_id', 'full_name phone_number avatar_url')
            .lean();

        if (!delivery) {
            throw this._error('Không tìm thấy delivery cho đơn này.', 404);
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

    // ── PATCH /api/food-donations/:id/self-pickup-complete ────────────────
    static async completeSelfPickupByReceiver(donationId, receiverId) {
        const donation = await FoodDonation.findById(donationId).lean();
        if (!donation) throw this._error('Không tìm thấy đơn quyên góp.', 404);

        if (!donation.selected_receiver_id || donation.selected_receiver_id.toString() !== receiverId.toString()) {
            throw this._error('Bạn không có quyền xác nhận đơn này.', 403);
        }

        if (donation.delivery_type !== 'SELF_PICKUP' || !donation.delivery_id) {
            throw this._error('Đơn này không ở chế độ tự lấy hàng.', 400);
        }

        const delivery = await Delivery.findById(donation.delivery_id).lean();
        if (!delivery) throw this._error('Không tìm thấy delivery của đơn này.', 404);

        if (delivery.status === 'DELIVERED') {
            return { message: 'Đơn đã được xác nhận hoàn tất trước đó.', already_completed: true };
        }

        if (delivery.status !== 'SELF_PICKUP_READY') {
            throw this._error('Đơn chưa ở trạng thái có thể xác nhận tự lấy hàng.', 400);
        }

        await Delivery.updateOne(
            { _id: delivery._id },
            { $set: { status: 'DELIVERED', delivered_at: new Date() } },
        );

        await FoodDonation.updateOne(
            { _id: donation._id },
            { $set: { status: 'COMPLETED' } },
        );

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

        return { message: 'Xác nhận tự lấy hàng thành công.', already_completed: false };
    }

    // ── PATCH /api/food-donations/:id/pickup-start ────────────────────────
    static async startPickupByVolunteer(donationId, volunteerId) {
        const donation = await FoodDonation.findOne({
            _id: donationId,
            volunteer_id: volunteerId,
            delivery_type: 'VIA_AGENT',
        }).lean();

        if (!donation) {
            throw this._error('Không tìm thấy đơn đã được bạn nhận.', 404);
        }

        if (!donation.delivery_id) {
            throw this._error('Đơn này chưa có delivery.', 400);
        }

        const delivery = await Delivery.findById(donation.delivery_id).lean();
        if (!delivery) {
            throw this._error('Không tìm thấy delivery của đơn này.', 404);
        }

        if (delivery.status === 'ON_THE_WAY') {
            return { message: 'Đơn đã được xác nhận đang giao.', already_started: true };
        }

        if (delivery.status === 'DELIVERED') {
            throw this._error('Đơn này đã được giao hoàn tất.', 400);
        }

        if (delivery.status !== 'AGENT_ASSIGNED') {
            throw this._error('Đơn chưa ở trạng thái có thể bắt đầu giao.', 400);
        }

        await Delivery.updateOne(
            { _id: delivery._id },
            { $set: { status: 'ON_THE_WAY', picked_up_at: new Date() } },
        );

        await FoodDonation.updateOne(
            { _id: donation._id },
            { $set: { status: 'PICKED_UP' } },
        );

        const volunteer = await User.findById(volunteerId).select('full_name').lean();
        const volunteerName = volunteer?.full_name || 'Volunteer';

        await Notification.create({
            user_id: donation.selected_receiver_id,
            title: 'Don hang dang tren duong giao',
            message: `${volunteerName} da lay hang va dang giao don "${donation.title}"`,
            type: 'VOLUNTEER_PICKUP_STARTED',
            related_entity_type: 'Delivery',
            related_entity_id: delivery._id,
        });

        await NotificationService.sendToUser(donation.selected_receiver_id, {
            title: 'Delivery on the way',
            body: `${volunteerName} has picked up your food and is on the way.`,
            data: {
                type: 'VOLUNTEER_PICKUP_STARTED',
                donation_id: donation._id.toString(),
                delivery_id: delivery._id.toString(),
            },
        }).catch(() => {});

        return { message: 'Đã xác nhận lấy hàng. Đơn đang được giao.', already_started: false };
    }

    // ── PATCH /api/food-donations/:id/delivered ───────────────────────────
    static async completeDeliveryByVolunteer(donationId, volunteerId) {
        const donation = await FoodDonation.findOne({
            _id: donationId,
            volunteer_id: volunteerId,
            delivery_type: 'VIA_AGENT',
        }).lean();

        if (!donation) {
            throw this._error('Không tìm thấy đơn đã được bạn nhận.', 404);
        }

        if (!donation.delivery_id) {
            throw this._error('Đơn này chưa có delivery.', 400);
        }

        const delivery = await Delivery.findById(donation.delivery_id).lean();
        if (!delivery) {
            throw this._error('Không tìm thấy delivery của đơn này.', 404);
        }

        if (delivery.status === 'DELIVERED') {
            return { message: 'Đơn đã được xác nhận giao hoàn tất trước đó.', already_completed: true };
        }

        if (delivery.status !== 'ON_THE_WAY') {
            throw this._error('Bạn cần xác nhận đã lấy hàng trước khi hoàn tất giao hàng.', 400);
        }

        await Delivery.updateOne(
            { _id: delivery._id },
            { $set: { status: 'DELIVERED', delivered_at: new Date() } },
        );

        await FoodDonation.updateOne(
            { _id: donation._id },
            { $set: { status: 'COMPLETED' } },
        );

        const volunteer = await User.findById(volunteerId).select('full_name').lean();
        const volunteerName = volunteer?.full_name || 'Volunteer';

        await Notification.create({
            user_id: donation.selected_receiver_id,
            title: 'Don hang da duoc giao thanh cong',
            message: `${volunteerName} da giao xong don "${donation.title}"`,
            type: 'VOLUNTEER_DELIVERY_COMPLETED',
            related_entity_type: 'Delivery',
            related_entity_id: delivery._id,
        });

        await Notification.create({
            user_id: donation.donor_id,
            title: 'Don hang cua ban da giao thanh cong',
            message: `${volunteerName} da giao thanh cong don "${donation.title}"`,
            type: 'VOLUNTEER_DELIVERY_COMPLETED',
            related_entity_type: 'FoodDonation',
            related_entity_id: donation._id,
        });

        await NotificationService.sendToUser(donation.selected_receiver_id, {
            title: 'Delivery completed',
            body: `Your donation "${donation.title}" has been delivered successfully.`,
            data: {
                type: 'VOLUNTEER_DELIVERY_COMPLETED',
                donation_id: donation._id.toString(),
                delivery_id: delivery._id.toString(),
            },
        }).catch(() => {});

        return { message: 'Đã xác nhận giao hàng thành công.', already_completed: false };
    }

    // ── PATCH /api/food-donations/:id/accept ───────────────────────────────
    static async acceptDonationByVolunteer(donationId, volunteerId) {
        const donation = await FoodDonation.findOne({ _id: donationId, status: 'PENDING' }).lean();
        if (!donation) {
            throw this._error('Đơn không tồn tại hoặc đã được nhận.', 404);
        }

        if (donation.delivery_type !== 'VIA_AGENT' || !donation.delivery_id) {
            throw this._error('Đơn này chưa chọn hình thức uỷ thác volunteer.');
        }

        const delivery = await Delivery.findById(donation.delivery_id)
            .select('preferred_volunteer_id status')
            .lean();

        if (!delivery) {
            throw this._error('Không tìm thấy delivery của đơn này.', 404);
        }

        if (
            delivery.status === 'WAITING_AGENT' &&
            delivery.preferred_volunteer_id &&
            delivery.preferred_volunteer_id.toString() !== volunteerId.toString()
        ) {
            throw this._error('Receiver đã chọn volunteer khác cho đơn này.', 403);
        }

        const updated = await FoodDonation.findOneAndUpdate(
            { _id: donationId, status: 'PENDING' },
            { status: 'ACCEPTED', volunteer_id: volunteerId },
            { new: true }
        );

        if (!updated) {
            throw this._error('Đơn không tồn tại hoặc đã được nhận.', 404);
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

    // ── PATCH /api/food-donations/:id/reject ───────────────────────────────
    static async rejectDonationByVolunteer(donationId, volunteerId) {
        const updated = await FoodDonation.findOneAndUpdate(
            { _id: donationId, status: 'PENDING' },
            { $addToSet: { rejected_by: volunteerId } },
            { new: true }
        );

        if (!updated) {
            throw this._error('Đơn không tồn tại hoặc không còn khả dụng.', 404);
        }

        if (updated.delivery_id) {
            const delivery = await Delivery.findById(updated.delivery_id)
                .select('preferred_volunteer_id status')
                .lean();

            if (
                delivery?.status === 'WAITING_AGENT' &&
                delivery.preferred_volunteer_id &&
                delivery.preferred_volunteer_id.toString() === volunteerId.toString()
            ) {
                await Delivery.updateOne(
                    { _id: updated.delivery_id },
                    { $set: { preferred_volunteer_id: null } },
                );
            }
        }

        return updated;
    }
}

module.exports = FoodDonationService;
