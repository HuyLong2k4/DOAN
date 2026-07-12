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

    static _profileModelForRole(role) {
        if (role === 'DONOR') return DonorProfile;
        if (role === 'RECEIVER') return ReceiverProfile;
        if (role === 'VOLUNTEER') return VolunteerProfile;
        return null;
    }

    static _isValidCoord(lat, lon) {
        if (typeof lat !== 'number' || typeof lon !== 'number') return false;
        if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
        if (Math.abs(lat) < 1e-6 && Math.abs(lon) < 1e-6) return false;
        return true;
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
        const normalizedContactName = contact_name ? String(contact_name).trim() : null;

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
                contact_name: normalizedContactName,
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
        if (normalizedContactName) {
            userUpdate.full_name = normalizedContactName;
        }

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
        const normalizedContactName = contact_name ? String(contact_name).trim() : null;

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
                contact_name: normalizedContactName,
                address_line,
                pin_code,
                city,
                latitude,
                longitude,
            },
            { upsert: true, new: true, runValidators: true }
        );

        const userUpdate = { onboarding_step: 4, profile_completed: true };
        if (normalizedContactName) {
            userUpdate.full_name = normalizedContactName;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            userUpdate,
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
            contact_name,
            address_line, pin_code, city,
            latitude, longitude,
            availability_days, availability_time,
            delivery_goal,
        } = data;
        const normalizedContactName = contact_name ? String(contact_name).trim() : null;

        if (!address_line || !city) {
            throw this._error('address_line, city là bắt buộc.');
        }

        await VolunteerProfile.findOneAndUpdate(
            { user_id: userId },
            {
                user_id: userId,
                contact_name: normalizedContactName,
                address_line, pin_code, city, latitude, longitude,
                availability_days, availability_time,
                delivery_goal,
            },
            { upsert: true, new: true, runValidators: true }
        );

        const userUpdate = { onboarding_step: 4, profile_completed: true };
        if (normalizedContactName) {
            userUpdate.full_name = normalizedContactName;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            userUpdate,
            { new: true }
        );

        return { message: 'Hồ sơ Volunteer đã hoàn tất.', user: this._safeUser(user) };
    }

    // ──────────────────────────────────────────────────────────────────────
    // GET /api/profile/me  — dùng trên màn hình Home để hiển thị thông tin
    // ──────────────────────────────────────────────────────────────────────
    static async getMyProfile(userId) {
        const user = await User.findById(userId).select('-password -fcm_token').lean();
        if (!user) throw this._error('Không tìm thấy tài khoản.', 404);

        let profile = null;
        if (user.role === 'DONOR')     profile = await DonorProfile.findOne({ user_id: userId });
        if (user.role === 'RECEIVER')  profile = await ReceiverProfile.findOne({ user_id: userId });
        if (user.role === 'VOLUNTEER') profile = await VolunteerProfile.findOne({ user_id: userId });

        // Chuẩn hoá `id` (string) cho client. Document thô chỉ có `_id`, khiến
        // user.id = undefined sau khi app nạp lại profile lúc khởi động — làm
        // hỏng mọi nơi client dùng user.id (vd. viewerId màn chat, PATCH /users/:id).
        // Giữ nguyên toàn bộ field khác.
        return { user: { ...user, id: String(user._id) }, profile };
    }

    static async updateMyLocation(userId, role, data = {}) {
        const ProfileModel = this._profileModelForRole(role);
        if (!ProfileModel) {
            throw this._error('Vai trò không hợp lệ.', 400);
        }

        const latitude = Number(data.latitude);
        const longitude = Number(data.longitude);
        if (!this._isValidCoord(latitude, longitude)) {
            throw this._error('Tọa độ không hợp lệ.', 400);
        }

        const profile = await ProfileModel.findOneAndUpdate(
            { user_id: userId },
            {
                latitude,
                longitude,
            },
            { new: true, runValidators: true }
        );

        if (!profile) {
            throw this._error('Không tìm thấy hồ sơ người dùng.', 404);
        }

        return {
            message: 'Đã cập nhật vị trí.',
            profile,
        };
    }

    static async toggleActiveStatus(userId) {
        const profile = await VolunteerProfile.findOne({ user_id: userId });
        if (!profile) throw this._error('Không tìm thấy hồ sơ volunteer.', 404);

        profile.is_active = !profile.is_active;
        await profile.save();
        return { is_active: profile.is_active };
    }

    // ──────────────────────────────────────────────────────────────────────
    // PATCH /api/profile/reset-role
    // Đặt lại vai trò để user chọn lại từ đầu (sửa trường hợp chọn nhầm role).
    // Xoá hồ sơ của role hiện tại, đưa role về UNSET + profile_completed=false
    // → guard điều hướng app quay về màn Select Role.
    // ──────────────────────────────────────────────────────────────────────
    static async resetRoleForReselect(userId, currentRole) {
        if (currentRole === 'DONOR')     await DonorProfile.deleteOne({ user_id: userId });
        if (currentRole === 'RECEIVER')  await ReceiverProfile.deleteOne({ user_id: userId });
        if (currentRole === 'VOLUNTEER') await VolunteerProfile.deleteOne({ user_id: userId });

        const user = await User.findByIdAndUpdate(
            userId,
            { role: 'UNSET', profile_completed: false, onboarding_step: 2 },
            { new: true }
        );
        if (!user) throw this._error('Không tìm thấy tài khoản.', 404);

        return { message: 'Đã đặt lại vai trò. Vui lòng chọn lại.', user: this._safeUser(user) };
    }
}

module.exports = ProfileService;
