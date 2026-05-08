const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const USER_ROLE = ['ADMIN', 'DONOR', 'RECEIVER', 'VOLUNTEER'];

class UserService {
    static async getUserById(id) {
        const user = await User.findById(id).select('-password');
        if (!user) {
            const error = new Error('Không tìm thấy user');
            error.statusCode = 404;
            throw error;
        }
        return user;
    }

    static async getAllUsers() {
        return await User.find().select('-password');
    }
    
    static async createUser(userData) {
        const { full_name, phone_number, email, password, avatar_url, role } = userData;

        if (email) {
            const existedEmail = await User.findOne({ email });
            if (existedEmail) {
                const error = new Error('Email đã tồn tại');
                error.statusCode = 400;
                throw error;
            }
        }

        if (phone_number) {
            const existedPhone = await User.findOne({ phone_number });
            if (existedPhone) {
                const error = new Error('Số điện thoại đã tồn tại');
                error.statusCode = 400;
                throw error;
            }
        }

        let safeRole = role || 'RECEIVER';
        if (!USER_ROLE.includes(safeRole)) safeRole = 'RECEIVER';

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const seed = (full_name || email || phone_number || 'user').trim();
        const defaultAvatarUrl =
            avatar_url?.trim() ||
            `https://api.dicebear.com/8.x/initials/png?seed=${encodeURIComponent(seed)}`;

        const user = await User.create({
            full_name,
            phone_number,
            email,
            password: passwordHash,
            avatar_url: defaultAvatarUrl,
            role: safeRole,
            is_phone_verified: safeRole === 'ADMIN',
        });

        return user;
    }

    static async addBadge(userId, badgeId) {
        const user = await User.findById(userId);
        if (!user) {
            const error = new Error('Không tìm thấy user');
            error.statusCode = 404;
            throw error;
        }
        
        user.earned_badges.push({ badge_id: badgeId, earned_at: new Date() });
        await user.save();
        
        return await User.findById(userId).select('-password');
    }

    static async getBadges(userId) {
        const user = await User.findById(userId).populate('earned_badges.badge_id');
        return user.earned_badges;
    }

    // 1. Cập nhật token (sau khi login)
    static async updateFCMToken(userId, token) {
        await User.findByIdAndUpdate(userId, { fcm_token: token });
    }

    // 2. Xóa token (khi logout)
    static async clearFCMToken(userId) {
        await User.findByIdAndUpdate(userId, { fcm_token: '' });
    }

    static async updateUser(id, updateData) {
        const user = await User.findById(id);
        if (!user) {
            const error = new Error('Không tìm thấy user');
            error.statusCode = 404;
            throw error;
        }

        if (updateData.email && updateData.email !== user.email) {
            const existedEmail = await User.findOne({ email: updateData.email });
            if (existedEmail) {
                const error = new Error('Email đã tồn tại');
                error.statusCode = 400;
                throw error;
            }
        }

        if (updateData.phone_number && updateData.phone_number !== user.phone_number) {
            const existedPhone = await User.findOne({ phone_number: updateData.phone_number });
            if (existedPhone) {
                const error = new Error('Số điện thoại đã tồn tại');
                error.statusCode = 400;
                throw error;
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');

        return updatedUser;
    }

    static async changePassword(id, oldPassword, newPassword) {
        const user = await User.findById(id);
        if (!user) {
            const error = new Error('Không tìm thấy user');
            error.statusCode = 404;
            throw error;
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            const error = new Error('Mật khẩu cũ không đúng');
            error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        user.password = passwordHash;
        user.token_version = (user.token_version || 0) + 1;
        await user.save();

        return { message: 'Đổi mật khẩu thành công' };
    }

    static async deleteUser(id) {
        const user = await User.findById(id);
        if (!user) {
            const error = new Error('Không tìm thấy user');
            error.statusCode = 404;
            throw error;
        }

        await User.findByIdAndDelete(id);
        return { message: 'Xóa user thành công' };
    }

    static async getLeaderboard(limit = 20) {
        const users = await User.find({ profile_completed: true })
            .select('full_name phone_number avatar_url points role')
            .sort({ points: -1 })
            .limit(limit);
        return users;
    }
}

module.exports = UserService;