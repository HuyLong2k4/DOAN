const User = require('../models/userModel');
const DonorProfile     = require('../models/donorProfileModel');
const ReceiverProfile  = require('../models/receiverProfileModel');
const VolunteerProfile = require('../models/volunteerProfileModel');

class ProfileService {

    static _error(message, statusCode = 400) {
        return Object.assign(new Error(message), { statusCode });
    }

    static _safeUser(user) {
        return {
            id:                user._id,
            full_name:         user.full_name,
            phone_number:      user.phone_number,
            email:             user.email,
            avatar_url:        user.avatar_url,
            role:              user.role,
            onboarding_step:   user.onboarding_step,
            profile_completed: user.profile_completed,
            points:            user.points,
        };
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

    static async _getProfileLocation(userId, role) {
        if (role === 'DONOR') {
            const donor = await DonorProfile.findOne({ user_id: userId }).select('latitude longitude');
            return donor ? { latitude: donor.latitude, longitude: donor.longitude } : { latitude: null, longitude: null };
        }

        if (role === 'RECEIVER') {
            const receiver = await ReceiverProfile.findOne({ user_id: userId }).select('latitude longitude');
            return receiver ? { latitude: receiver.latitude, longitude: receiver.longitude } : { latitude: null, longitude: null };
        }

        if (role === 'VOLUNTEER') {
            const volunteer = await VolunteerProfile.findOne({ user_id: userId }).select('latitude longitude');
            return volunteer ? { latitude: volunteer.latitude, longitude: volunteer.longitude } : { latitude: null, longitude: null };
        }

        return { latitude: null, longitude: null };
    }

    // ──────────────────────────────────────────────────────────────────────
    // UI: Donor Details — Restaurant / Bakery / Individual tab
    // POST /api/profile/donor
    // ──────────────────────────────────────────────────────────────────────
    static async completeDonorProfile(userId, data) {
        const {
            donor_type, business_name, contact_name, email,
            address_line, pin_code, city,
            latitude, longitude,
        } = data;

        if (!donor_type || !address_line || !city) {
            throw this._error('donor_type, address_line, city là bắt buộc.');
        }

        const VALID_TYPES = ['RESTAURANT', 'BAKERY', 'INDIVIDUAL'];
        if (!VALID_TYPES.includes(donor_type)) {
            throw this._error('donor_type không hợp lệ.');
        }

        await DonorProfile.findOneAndUpdate(
            { user_id: userId },
            {
                user_id: userId,
                donor_type,
                business_name,
                contact_name,
                address_line,
                pin_code,
                city,
                latitude,
                longitude,
            },
            { upsert: true, new: true, runValidators: true }
        );

        const userUpdate = { onboarding_step: 4, profile_completed: true };
        if (email) userUpdate.email = email.trim();

        const user = await User.findByIdAndUpdate(
            userId,
            userUpdate,
            { new: true }
        );

        return { message: 'Hồ sơ Donor đã hoàn tất.', user: this._safeUser(user) };
    }

    // ──────────────────────────────────────────────────────────────────────
    // UI: Receiver Details — Trust / NGO / Individual tab
    // POST /api/profile/receiver
    // ──────────────────────────────────────────────────────────────────────
    static async completeReceiverProfile(userId, data) {
        const {
            receiver_type, organization_name, contact_name,
            address_line, pin_code, city,
            latitude, longitude,
        } = data;

        if (!receiver_type || !address_line || !city) {
            throw this._error('receiver_type, address_line, city là bắt buộc.');
        }

        const VALID_TYPES = ['TRUST', 'NGO', 'INDIVIDUAL', 'ORPHANAGE', 'SHELTER'];
        if (!VALID_TYPES.includes(receiver_type)) {
            throw this._error('receiver_type không hợp lệ.');
        }

        await ReceiverProfile.findOneAndUpdate(
            { user_id: userId },
            {
                user_id: userId,
                receiver_type,
                organization_name,
                contact_name,
                address_line,
                pin_code,
                city,
                latitude,
                longitude,
            },
            { upsert: true, new: true, runValidators: true }
        );

        const user = await User.findByIdAndUpdate(
            userId,
            { onboarding_step: 4, profile_completed: true },
            { new: true }
        );

        return { message: 'Hồ sơ Receiver đã hoàn tất.', user: this._safeUser(user) };
    }

    // ──────────────────────────────────────────────────────────────────────
    // UI: Volunteer Details — Name, phone, address + Govt ID + Availability
    // POST /api/profile/volunteer
    // ──────────────────────────────────────────────────────────────────────
    static async completeVolunteerProfile(userId, data) {
        const {
            address_line, pin_code, city,
            latitude, longitude,
            verification_document_type, verification_document_url,
            availability_days, availability_time,
            delivery_goal,
        } = data;

        if (!address_line || !city) {
            throw this._error('address_line, city là bắt buộc.');
        }

        await VolunteerProfile.findOneAndUpdate(
            { user_id: userId },
            {
                user_id: userId,
                address_line, pin_code, city, latitude, longitude,
                verification_document_type, verification_document_url,
                availability_days, availability_time,
                delivery_goal,
            },
            { upsert: true, new: true, runValidators: true }
        );

        const user = await User.findByIdAndUpdate(
            userId,
            { onboarding_step: 4, profile_completed: true },
            { new: true }
        );

        return { message: 'Hồ sơ Volunteer đã hoàn tất.', user: this._safeUser(user) };
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/profile/me  — dùng trên màn hình Home để hiển thị thông tin
    // ──────────────────────────────────────────────────────────────────────
    static async getMyProfile(userId) {
        const user = await User.findById(userId).select('-password -fcm_token');
        if (!user) throw this._error('Không tìm thấy tài khoản.', 404);

        let profile = null;
        if (user.role === 'DONOR')     profile = await DonorProfile.findOne({ user_id: userId });
        if (user.role === 'RECEIVER')  profile = await ReceiverProfile.findOne({ user_id: userId });
        if (user.role === 'VOLUNTEER') profile = await VolunteerProfile.findOne({ user_id: userId });

        return { user, profile };
    }

    // ──────────────────────────────────────────────────────────────────────
    // PATCH /api/profile/location  — cập nhật tọa độ GPS (pin on map)
    // ──────────────────────────────────────────────────────────────────────
    static async updateLocation(userId, role, latitude, longitude) {
        if (latitude == null || longitude == null) {
            throw this._error('Thiếu latitude hoặc longitude.');
        }

        const update = { latitude, longitude };

        if (role === 'DONOR')     await DonorProfile.findOneAndUpdate({ user_id: userId }, update);
        if (role === 'RECEIVER')  await ReceiverProfile.findOneAndUpdate({ user_id: userId }, update);
        if (role === 'VOLUNTEER') await VolunteerProfile.findOneAndUpdate({ user_id: userId }, update);

        return { message: 'Vị trí đã được cập nhật.' };
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/profile/ngos-nearby — danh sách Receiver loại NGO
    // ──────────────────────────────────────────────────────────────────────
    static async getNearbyNgos(userId, role, limit = 8) {
        const safeLimit = Math.max(1, Math.min(limit, 50));

        const requesterLocation = await this._getProfileLocation(userId, role);
        const canMeasureDistance =
            requesterLocation.latitude != null && requesterLocation.longitude != null;

        const receiverProfiles = await ReceiverProfile.find({ receiver_type: 'NGO' })
            .select('user_id contact_name address_line pin_code city latitude longitude')
            .populate({
                path: 'user_id',
                select: 'full_name avatar_url points role profile_completed',
                match: { role: 'RECEIVER', profile_completed: true },
            })
            .lean();

        const ngoList = receiverProfiles
            .filter((item) => item.user_id)
            .map((item) => {
                const user = item.user_id;
                const hasNgoLocation = item.latitude != null && item.longitude != null;

                let distance_km = null;
                if (canMeasureDistance && hasNgoLocation) {
                    distance_km = this._distanceKm(
                        requesterLocation.latitude,
                        requesterLocation.longitude,
                        item.latitude,
                        item.longitude
                    );
                }

                return {
                    id: user._id,
                    name: item.contact_name || user.full_name || 'NGO',
                    address_line: item.address_line,
                    pin_code: item.pin_code || null,
                    city: item.city,
                    avatar_url: user.avatar_url || null,
                    points: user.points || 0,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    distance_km,
                };
            });

        ngoList.sort((a, b) => {
            if (a.distance_km == null && b.distance_km == null) return a.name.localeCompare(b.name);
            if (a.distance_km == null) return 1;
            if (b.distance_km == null) return -1;
            return a.distance_km - b.distance_km;
        });

        return {
            ngos: ngoList.slice(0, safeLimit),
            requester_has_location: canMeasureDistance,
        };
    }
}

module.exports = ProfileService;
