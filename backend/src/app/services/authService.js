const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const OtpSession = require('../models/otpSessionModel');
const { generateOtp, hashOtp, compareOtp } = require('../utils/otpUtil');

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS   = 5;

class AuthService {

    // ─────────────────────────────── HELPERS ───────────────────────────────

    static _makeJwt(user, expiresIn = '7d') {
        return jwt.sign(
            {
                id: user._id,
                role: user.role,
                tokenVersion: user.token_version || 0,
            },
            process.env.JWT_SECRET,
            { expiresIn }
        );
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
            is_phone_verified: user.is_phone_verified,
            points:            user.points,
        };
    }

    static _error(message, statusCode = 400) {
        return Object.assign(new Error(message), { statusCode });
    }

    /**
     * Tạo OTP mới, xóa OTP cũ chưa dùng cùng mục đích, lưu DB và log ra console.
     * TODO: Thay console.log bằng SMS service (Twilio / Firebase Phone Auth) ở production.
     */
    static async _sendOtp(phone_number, purpose) {
        await OtpSession.deleteMany({ phone_number, purpose, used_at: null });

        const otp        = generateOtp();
        const otp_hash   = await hashOtp(otp);
        const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await OtpSession.create({ phone_number, purpose, otp_hash, expires_at });

        // DEV ONLY — xóa dòng này khi tích hợp SMS service thật
        console.log(`\n[OTP][${purpose}] ${phone_number}  →  ${otp}  (hết hạn sau ${OTP_EXPIRY_MINUTES} phút)\n`);
    }

    // ─────────────────────────────── SIGN UP ───────────────────────────────

    /**
     * UI: Sign Up Page (phone_number + password + confirm_password)
     * Tạo user mới → gửi OTP xác minh số điện thoại.
     * Nếu số đã đăng ký nhưng chưa xác minh → gửi lại OTP.
     */
    static async signup(phone_number, password, full_name) {
        const existing = await User.findOne({ phone_number });

        if (existing) {
            if (existing.is_phone_verified) {
                throw this._error('Số điện thoại đã được đăng ký.', 409);
            }
            // Chưa verified → cập nhật mật khẩu mới và gửi lại OTP
            const password_hash = await bcrypt.hash(password, 10);
            await User.findByIdAndUpdate(existing._id, {
                password: password_hash,
                full_name: full_name ? String(full_name).trim() : existing.full_name,
            });
            await this._sendOtp(phone_number, 'SIGNUP');
            return { message: 'OTP đã được gửi lại.' };
        }

        const password_hash = await bcrypt.hash(password, 10);
        await User.create({
            phone_number,
            password: password_hash,
            full_name: full_name ? String(full_name).trim() : null,
            onboarding_step: 1,   // Bước tiếp theo: xác minh OTP
        });

        await this._sendOtp(phone_number, 'SIGNUP');
        return { message: 'OTP đã được gửi.' };
    }

    // ─────────────────────────────── VERIFY OTP ────────────────────────────

    /**
     * UI: OTP Screen
     * - purpose = 'SIGNUP'        → trả về accessToken để vào app
     * - purpose = 'RESET_PASSWORD' → trả về reset_token (JWT 5 phút) để đặt lại mật khẩu
     */
    static async verifyOtp(phone_number, otp, purpose) {
        const session = await OtpSession
            .findOne({ phone_number, purpose, used_at: null, expires_at: { $gt: new Date() } })
            .sort({ created_at: -1 });

        if (!session) {
            throw this._error('OTP không hợp lệ hoặc đã hết hạn.', 400);
        }
        if (session.attempt_count >= MAX_OTP_ATTEMPTS) {
            throw this._error('Vượt quá số lần thử. Vui lòng yêu cầu OTP mới.', 429);
        }

        const isMatch = await compareOtp(otp, session.otp_hash);
        if (!isMatch) {
            await OtpSession.findByIdAndUpdate(session._id, { $inc: { attempt_count: 1 } });
            const remaining = MAX_OTP_ATTEMPTS - session.attempt_count - 1;
            throw this._error(`OTP không chính xác. Còn ${remaining} lần thử.`, 400);
        }

        // Đánh dấu đã dùng
        await OtpSession.findByIdAndUpdate(session._id, { used_at: new Date() });

        if (purpose === 'SIGNUP') {
            const user = await User.findOneAndUpdate(
                { phone_number },
                { is_phone_verified: true, onboarding_step: 2 },
                { new: true }
            );
            if (!user) throw this._error('Không tìm thấy tài khoản.', 404);

            return {
                message:     'Xác minh thành công.',
                accessToken: this._makeJwt(user),
                user:        this._safeUser(user),
            };
        }

        if (purpose === 'RESET_PASSWORD') {
            // Trả về token đặc biệt chỉ dùng để reset password (hết hạn sau 5 phút)
            const reset_token = jwt.sign(
                { phone_number, purpose: 'RESET_PASSWORD' },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            return { message: 'OTP hợp lệ.', reset_token };
        }

        return { message: 'OTP hợp lệ.' };
    }

    // ─────────────────────────────── RESEND OTP ────────────────────────────

    /**
     * UI: "Resend code" link trên màn hình OTP
     */
    static async resendOtp(phone_number, purpose) {
        const user = await User.findOne({ phone_number });
        if (!user) throw this._error('Số điện thoại chưa được đăng ký.', 404);

        await this._sendOtp(phone_number, purpose);
        return { message: 'OTP đã được gửi lại.' };
    }

    // ─────────────────────────────── LOGIN ─────────────────────────────────

    /**
     * UI: Login Screen (phone_number hoặc email + password)
     */
    static async login(identifier, password) {
        const user = await User.findOne({
            $or: [{ phone_number: identifier }, { email: identifier }],
        });

        if (!user || !user.password) {
            throw this._error('Thông tin đăng nhập không đúng.', 401);
        }
        if (!user.is_phone_verified) {
            throw this._error('Số điện thoại chưa được xác minh.', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw this._error('Thông tin đăng nhập không đúng.', 401);
        }

        return {
            accessToken: this._makeJwt(user),
            user:        this._safeUser(user),
        };
    }

    // ─────────────────────────────── FORGOT PASSWORD ───────────────────────

    /**
     * UI: Forgot Password Screen (nhập phone/email → nhận OTP)
     */
    static async forgotPassword(identifier) {
        const user = await User.findOne({
            $or: [{ phone_number: identifier }, { email: identifier }],
        });
        if (!user) throw this._error('Tài khoản không tồn tại.', 404);
        if (!user.phone_number) throw this._error('Tài khoản này không có số điện thoại để xác minh.', 400);

        await this._sendOtp(user.phone_number, 'RESET_PASSWORD');
        // Không lộ phone_number đầy đủ — chỉ trả về phần đuôi để hiển thị trên UI
        const masked = user.phone_number.replace(/(\d{2})\d+(\d{3})/, '$1*****$2');
        return { message: `OTP đã được gửi đến ${masked}.`, phone_number: user.phone_number };
    }

    // ─────────────────────────────── RESET PASSWORD ────────────────────────

    /**
     * UI: Reset Password Screen (nhập mật khẩu mới + xác nhận)
     * Yêu cầu reset_token từ bước verifyOtp (purpose=RESET_PASSWORD).
     */
    static async resetPassword(reset_token, new_password) {
        let payload;
        try {
            payload = jwt.verify(reset_token, process.env.JWT_SECRET);
        } catch {
            throw this._error('Token không hợp lệ hoặc đã hết hạn. Vui lòng xác minh OTP lại.', 400);
        }

        if (payload.purpose !== 'RESET_PASSWORD') {
            throw this._error('Token không đúng mục đích.', 400);
        }

        const password_hash = await bcrypt.hash(new_password, 10);
        await User.findOneAndUpdate(
            { phone_number: payload.phone_number },
            {
                password: password_hash,
                $inc: { token_version: 1 },
            },
        );

        return { message: 'Mật khẩu đã được đặt lại thành công.' };
    }

    // ─────────────────────────────── SELECT ROLE ───────────────────────────

    /**
     * UI: Select Profile Screen (Donor / Receiver / Volunteer)
     */
    static async selectRole(userId, role) {
        const VALID = ['DONOR', 'RECEIVER', 'VOLUNTEER'];
        if (!VALID.includes(role)) throw this._error('Role không hợp lệ.', 400);

        const user = await User.findByIdAndUpdate(
            userId,
            { role, onboarding_step: 3 },
            { new: true }
        );
        if (!user) throw this._error('Không tìm thấy tài khoản.', 404);

        return { message: 'Role đã được cập nhật.', user: this._safeUser(user) };
    }

    // ─────────────────────────────── LOGOUT ────────────────────────────────

    static async logout(userId) {
        // Tăng token_version để vô hiệu hoá tất cả JWT đã phát hành cho user này.
        await User.findByIdAndUpdate(userId, {
            fcm_token: '',
            $inc: { token_version: 1 },
        });
        return { message: 'Đăng xuất thành công.' };
    }
}

module.exports = AuthService;