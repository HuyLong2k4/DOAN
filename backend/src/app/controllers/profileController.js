const ProfileService = require('../services/profileService');

class ProfileController {

    // ── GET /api/profile/me ────────────────────────────────────────────────
    static async getMyProfile(req, res) {
        try {
            const result = await ProfileService.getMyProfile(req.user.id);
            return res.status(200).json({ success: true, data: result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/profile/donor ────────────────────────────────────────────
    // UI: Donor Details form (Restaurant / Bakery / Individual)
    static async completeDonorProfile(req, res) {
        try {
            if (req.user.role !== 'DONOR') {
                return res.status(403).json({ success: false, message: 'Chỉ Donor mới có thể thực hiện.' });
            }
            const result = await ProfileService.completeDonorProfile(req.user.id, req.body);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/profile/receiver ─────────────────────────────────────────
    // UI: Receiver Details form (Trust / NGO / Individual)
    static async completeReceiverProfile(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chỉ Receiver mới có thể thực hiện.' });
            }
            const result = await ProfileService.completeReceiverProfile(req.user.id, req.body);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/profile/volunteer ────────────────────────────────────────
    // UI: Volunteer Details form (Name, phone, Govt ID, Availability)
    static async completeVolunteerProfile(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể thực hiện.' });
            }
            const result = await ProfileService.completeVolunteerProfile(req.user.id, req.body);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/profile/volunteer/active-status ────────────────────────
    static async toggleActiveStatus(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể thực hiện.' });
            }
            const result = await ProfileService.toggleActiveStatus(req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }
}

module.exports = ProfileController;
