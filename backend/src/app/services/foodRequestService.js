const FoodRequest = require('../models/foodRequestModel');

class FoodRequestService {
  static _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
  }

  static async createRequest(receiverId, data) {
    const {
      title,
      description,
      requested_quantity,
      unit,
      food_preference,
      needed_before,
    } = data;

    if (!title) throw this._error('title là bắt buộc.');
    if (!requested_quantity || requested_quantity < 1) {
      throw this._error('requested_quantity phải >= 1.');
    }

    const VALID_PREF = ['VEG', 'NON_VEG', 'BOTH'];
    if (food_preference && !VALID_PREF.includes(food_preference)) {
      throw this._error(`food_preference không hợp lệ. Các giá trị hợp lệ: ${VALID_PREF.join(', ')}`);
    }

    const request = await FoodRequest.create({
      receiver_id: receiverId,
      title,
      description: description || null,
      requested_quantity,
      unit: unit || 'portion',
      food_preference: food_preference || 'BOTH',
      needed_before: needed_before ? new Date(needed_before) : null,
    });

    return { message: 'Tạo yêu cầu nhận thực phẩm thành công.', request };
  }

  static async getRequests(filter = {}) {
    return FoodRequest.find({ status: 'PENDING', ...filter })
      .sort({ createdAt: -1 })
      .populate('receiver_id', 'full_name avatar_url')
      .lean();
  }

  static async getMyRequests(receiverId) {
    return FoodRequest.find({ receiver_id: receiverId })
      .sort({ createdAt: -1 })
      .populate('receiver_id', 'full_name avatar_url')
      .lean();
  }

  static async cancelMyRequest(requestId, receiverId) {
    const updated = await FoodRequest.findOneAndUpdate(
      {
        _id: requestId,
        receiver_id: receiverId,
        status: { $in: ['PENDING', 'ACCEPTED'] },
      },
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!updated) {
      throw this._error('Yêu cầu không tồn tại hoặc không thể hủy.', 404);
    }

    return updated;
  }
}

module.exports = FoodRequestService;
