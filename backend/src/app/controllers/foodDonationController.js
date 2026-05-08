const FoodDonationService = require('../services/foodDonationService');

class FoodDonationController {

    // ── POST /api/food-donations ────────────────────────────────────────────
    static async createDonation(req, res) {
        try {
            if (req.user.role !== 'DONOR') {
                return res.status(403).json({ success: false, message: 'Chỉ Donor mới có thể tạo đơn quyên góp.' });
            }
            const result = await FoodDonationService.createDonation(req.user.id, req.body);
            return res.status(201).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/food-donations ─────────────────────────────────────────────
    static async getDonations(req, res) {
        try {
            const filter = {};
            if (req.user.role === 'ADMIN' && req.query.status) {
                const statuses = String(req.query.status).split(',').map((s) => s.trim()).filter(Boolean);
                if (statuses.length === 1) filter.status = statuses[0];
                else if (statuses.length > 1) filter.status = { $in: statuses };
            }
            const donations = await FoodDonationService.getDonations(req.user, filter);
            return res.status(200).json({ success: true, data: donations });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/food-donations/my ──────────────────────────────────────────
    static async getMyDonations(req, res) {
        try {
            const donations = await FoodDonationService.getMyDonations(req.user.id);
            return res.status(200).json({ success: true, data: donations });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/food-donations/volunteer/summary ───────────────────────
    static async getVolunteerSummary(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể xem thống kê.' });
            }

            const data = await FoodDonationService.getVolunteerSummary(req.user.id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/food-donations/volunteer/my-deliveries ─────────────────
    static async getMyVolunteerDeliveries(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể xem danh sách đơn đã nhận.' });
            }

            const data = await FoodDonationService.getMyVolunteerDeliveries(req.user.id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/food-donations/:id/available-volunteers ─────────────────
    static async getAvailableVolunteers(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chỉ Receiver mới có thể xem danh sách volunteer.' });
            }

            const limit = parseInt(req.query.limit, 10) || 20;
            const data = await FoodDonationService.getAvailableVolunteersForDonation(req.params.id, req.user.id, limit);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/food-donations/:id/tracking ───────────────────────────────
    static async getReceiverTracking(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chỉ Receiver mới có thể xem tracking đơn này.' });
            }

            const data = await FoodDonationService.getReceiverTracking(req.params.id, req.user.id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/accept ───────────────────────────────
    static async acceptDonation(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể nhận đơn.' });
            }

            const donation = await FoodDonationService.acceptDonationByVolunteer(req.params.id, req.user.id);
            return res.status(200).json({ success: true, message: 'Nhận đơn thành công.', data: donation });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/reject ───────────────────────────────
    static async rejectDonation(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể từ chối đơn.' });
            }

            const donation = await FoodDonationService.rejectDonationByVolunteer(req.params.id, req.user.id);
            return res.status(200).json({ success: true, message: 'Đã bỏ qua đơn.', data: donation });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/pickup-start ───────────────────────
    static async startPickup(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể xác nhận lấy hàng.' });
            }

            const pickupCode = req.body?.pickup_code ?? null;
            const result = await FoodDonationService.startPickupByVolunteer(
                req.params.id,
                req.user.id,
                pickupCode,
            );
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/delivered ──────────────────────────
    static async markDelivered(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể xác nhận giao thành công.' });
            }

            const result = await FoodDonationService.completeDeliveryByVolunteer(req.params.id, req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/connect ─────────────────────────────
    static async connectDonation(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chỉ Receiver mới có thể connect đơn.' });
            }

            const result = await FoodDonationService.connectDonationByReceiver(req.params.id, req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/receiver-delivery-choice ────────────
    static async chooseDeliveryByReceiver(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chỉ Receiver mới có thể chọn cách nhận hàng.' });
            }

            const result = await FoodDonationService.chooseDeliveryByReceiver(
                req.params.id,
                req.user.id,
                req.body?.delivery_type,
                req.body?.preferred_agent_id,
            );
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/self-pickup-complete ────────────────
    static async completeSelfPickupByReceiver(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chỉ Receiver mới có thể xác nhận tự lấy hàng.' });
            }

            const result = await FoodDonationService.completeSelfPickupByReceiver(req.params.id, req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/confirm-received ────────────────────
    static async confirmDeliveryReceived(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chỉ Receiver mới có thể xác nhận đã nhận hàng.' });
            }

            const result = await FoodDonationService.confirmDeliveryReceived(req.params.id, req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/cancel ──────────────────────────────
    static async cancelDonation(req, res) {
        try {
            if (req.user.role !== 'DONOR') {
                return res.status(403).json({ success: false, message: 'Chỉ Donor mới có thể huỷ đơn.' });
            }

            const result = await FoodDonationService.cancelDonationByDonor(req.params.id, req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── PATCH /api/food-donations/:id/release ─────────────────────────────
    static async releaseDonation(req, res) {
        try {
            if (req.user.role !== 'VOLUNTEER') {
                return res.status(403).json({ success: false, message: 'Chỉ Volunteer mới có thể trả đơn.' });
            }

            const result = await FoodDonationService.releaseDonationByVolunteer(req.params.id, req.user.id);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

}

module.exports = FoodDonationController;
