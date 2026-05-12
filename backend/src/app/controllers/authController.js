const AuthService = require('../services/authService');

class AuthController {

    // ── POST /api/auth/signup ──────────────────────────────────────────────
    static async signup(req, res) {
        try {
            const { full_name, phone_number, password, confirm_password } = req.body;

            if (!full_name || !phone_number || !password || !confirm_password) {
                return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
            }
            if (!String(full_name).trim()) {
                return res.status(400).json({ success: false, message: 'Tên không được để trống.' });
            }
            if (!/^\d{9,15}$/.test(phone_number)) {
                return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' });
            }
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
            }
            if (password !== confirm_password) {
                return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp.' });
            }

            const result = await AuthService.signup(phone_number, password, String(full_name).trim());
            return res.status(201).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/auth/verify-otp ──────────────────────────────────────────
    static async verifyOtp(req, res) {
        try {
            const { phone_number, otp, purpose } = req.body;

            if (!phone_number || !otp || !purpose) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
            }
            const VALID_PURPOSE = ['SIGNUP', 'RESET_PASSWORD'];
            if (!VALID_PURPOSE.includes(purpose)) {
                return res.status(400).json({ success: false, message: 'Purpose không hợp lệ.' });
            }

            const result = await AuthService.verifyOtp(phone_number, otp, purpose);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/auth/resend-otp ──────────────────────────────────────────
    static async resendOtp(req, res) {
        try {
            const { phone_number, purpose } = req.body;
            if (!phone_number || !purpose) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
            }

            const result = await AuthService.resendOtp(phone_number, purpose);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/auth/login ───────────────────────────────────────────────
    static async login(req, res) {
        try {
            const { identifier, password } = req.body;   // identifier = phone_number hoặc email

            if (!identifier || !password) {
                return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
            }

            const result = await AuthService.login(identifier, password);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/auth/forgot-password ────────────────────────────────────
    static async forgotPassword(req, res) {
        try {
            const { identifier } = req.body;  // phone_number hoặc email
            if (!identifier) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại hoặc email.' });
            }

            const result = await AuthService.forgotPassword(identifier);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/auth/reset-password ─────────────────────────────────────
    static async resetPassword(req, res) {
        try {
            const { reset_token, new_password, confirm_password } = req.body;

            if (!reset_token || !new_password || !confirm_password) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
            }
            if (new_password.length < 6) {
                return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
            }
            if (new_password !== confirm_password) {
                return res.status(400).json({ success: false, message: 'Mật khẩu xác nhận không khớp.' });
            }

            const result = await AuthService.resetPassword(reset_token, new_password);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/auth/select-role  [protected] ───────────────────────────
    static async selectRole(req, res) {
        try {
            const { role } = req.body;
            if (!role) {
                return res.status(400).json({ success: false, message: 'Vui lòng chọn role.' });
            }

            const result = await AuthService.selectRole(req.user.id, role);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/auth/logout  [protected] ────────────────────────────────
    static async logout(req, res) {
        try {
            const result = await AuthService.logout(req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }
}

module.exports = AuthController;