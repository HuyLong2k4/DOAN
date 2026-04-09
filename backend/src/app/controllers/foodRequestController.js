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
      const requests = await FoodRequestService.getRequests();
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

  static async cancelMyRequest(req, res) {
    try {
      const request = await FoodRequestService.cancelMyRequest(req.params.id, req.user.id);
      return res.status(200).json({ success: true, message: 'Đã hủy yêu cầu.', data: request });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = FoodRequestController;
