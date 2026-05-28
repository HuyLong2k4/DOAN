const FoodRequestService = require('../services/foodRequestService');

class FoodRequestController {
  static async createRequest(req, res) {
    try {
      if (req.user.role !== 'RECEIVER') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ Receiver mới có thể tạo yêu cầu nhận thực phẩm.',
        });
      }

      const result = await FoodRequestService.createRequest(req.user.id, req.body);
      return res.status(201).json({ success: true, ...result });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  static async getRequests(req, res) {
    try {
      const filter = {};
      if (req.user.role === 'ADMIN' && req.query.status) {
        const statuses = String(req.query.status).split(',').map((s) => s.trim()).filter(Boolean);
        if (statuses.length === 1) filter.status = statuses[0];
        else if (statuses.length > 1) filter.status = { $in: statuses };
      }
      const requests = await FoodRequestService.getRequests(req.user, filter);
      return res.status(200).json({ success: true, data: requests });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  static async getMyRequests(req, res) {
    try {
      const requests = await FoodRequestService.getMyRequests(req.user.id);
      return res.status(200).json({ success: true, data: requests });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  static async acceptRequestByDonor(req, res) {
    try {
      if (req.user.role !== 'DONOR') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ Donor mới có thể tiếp nhận yêu cầu.',
        });
      }

      const request = await FoodRequestService.acceptRequestByDonor(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Đã tiếp nhận yêu cầu thành công.', data: request });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  static async deleteMyRequest(req, res) {
    try {
      const request = await FoodRequestService.deleteMyRequest(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Đã xoá yêu cầu vĩnh viễn.', data: request });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = FoodRequestController;
