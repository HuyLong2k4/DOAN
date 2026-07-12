const FoodRequest = require('../models/foodRequestModel');
const FoodDonation = require('../models/foodDonationModel');
const User = require('../models/userModel');
const NotificationService = require('./notificationService');
const { findNearbyDonorIds } = require('./foodDonation/locationFilter');
const { assertReceiverClaimLimit } = require('./foodDonation/receiverClaimLimit');

class FoodRequestService {
  static _error(message, statusCode = 400) {
    return Object.assign(new Error(message), { statusCode });
  }

  static _resolveFoodTypeFromRequest(request) {
    const VALID_TYPES = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];
    if (request?.food_type && VALID_TYPES.includes(request.food_type)) {
      return request.food_type;
    }

    const firstLine = String(request?.description || '').split('\n')[0] || '';
    const normalized = firstLine.replace(/^Food type:\s*/i, '').trim().toUpperCase();

    if (normalized.includes('FROZEN')) return 'FROZEN';
    if (normalized.includes('PACKAGED')) return 'PACKAGED';
    if (normalized.includes('RAW') || normalized.includes('FRUIT') || normalized.includes('VEG')) return 'RAW';
    return 'COOKED';
  }

  static _resolveExpirationDatetimeFromRequest(request) {
    const now = new Date();
    const candidate = request?.needed_before ? new Date(request.needed_before) : null;
    if (candidate && !Number.isNaN(candidate.getTime()) && candidate.getTime() > now.getTime()) {
      return candidate;
    }

    return new Date(now.getTime() + 6 * 60 * 60 * 1000);
  }

  static async createRequest(receiverId, data) {
    const {
      title,
      description,
      requested_quantity,
      unit,
      food_type,
      needed_before,
    } = data;

    if (!title) throw this._error('title là bắt buộc.');
    if (!requested_quantity || requested_quantity < 1) {
      throw this._error('requested_quantity phải >= 1.');
    }

    const VALID_FOOD_TYPE = ['COOKED', 'RAW', 'FROZEN', 'PACKAGED'];
    if (food_type && !VALID_FOOD_TYPE.includes(food_type)) {
      throw this._error(`food_type không hợp lệ. Các giá trị hợp lệ: ${VALID_FOOD_TYPE.join(', ')}`);
    }

    const request = await FoodRequest.create({
      receiver_id: receiverId,
      title,
      description: description || null,
      requested_quantity,
      unit: unit || 'portion',
      food_type: food_type || 'COOKED',
      needed_before: needed_before ? new Date(needed_before) : null,
    });

    // Tạo thông báo cho donor khi có request mới — chỉ broadcast cho donor gần receiver
    // (≤ 10km) thay vì gửi toàn bộ user role=DONOR như trước (gây flood + tốn FCM quota).
    try {
      const donorIds = await findNearbyDonorIds(receiverId);

      if (donorIds.length > 0) {
        const receiver = await User.findById(receiverId).select('full_name').lean();
        const receiverName = receiver?.full_name || 'Receiver';
        const qtyText = `${requested_quantity} ${unit || 'portion'}`;

        await NotificationService.dispatch({
          userIds: donorIds,
          key: 'request.new',
          params: { receiverName, qty: qtyText },
          type: 'NEW_FOOD_REQUEST',
          data: {
            request_id: String(request._id),
            receiver_id: String(receiverId),
            click_action: 'NOTIFICATIONS_SCREEN',
          },
          related_entity_type: 'FoodRequest',
          related_entity_id: request._id,
        });
      }
    } catch (notifyErr) {
      console.error('Create request notification failed:', notifyErr?.message || notifyErr);
    }

    return { message: 'Tạo yêu cầu nhận thực phẩm thành công.', request };
  }

  static async getRequests(viewer = null, filter = {}) {
    const query = { ...filter };
    if (viewer?.role === 'ADMIN') {
      // Admin xem tất cả mặc định, có thể truyền status để lọc.
      if (!query.status) delete query.status;
    } else if (viewer?.role === 'DONOR' && viewer?.id) {
      // Donor xem PENDING (để pick) + các ACCEPTED do chính họ accept.
      // Ẩn các request đã quá `needed_before` để donor không phải accept request
      // "thây ma" — request mà receiver không còn cần nữa.
      if (!query.status) {
        query.$or = [
          { status: 'PENDING' },
          { status: 'ACCEPTED', accepted_by_donor_id: viewer.id },
        ];
      }
      query.$and = [
        ...(query.$and || []),
        { $or: [{ needed_before: null }, { needed_before: { $gte: new Date() } }] },
      ];
    } else {
      query.status = query.status || 'PENDING';
    }

    return FoodRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('receiver_id', 'full_name avatar_url')
      .populate('linked_donation_id', 'title status delivery_type')
      .lean();
  }

  static async getMyRequests(receiverId) {
    return FoodRequest.find({ receiver_id: receiverId })
      .sort({ createdAt: -1 })
      .populate('receiver_id', 'full_name avatar_url')
      .populate('linked_donation_id', 'title status delivery_type delivery_id')
      .lean();
  }

  static async acceptRequestByDonor(requestId, donorId) {
    const pendingRequest = await FoodRequest.findOne({ _id: requestId, status: 'PENDING' })
      .select('receiver_id')
      .lean();
    if (!pendingRequest) {
      throw this._error('Yêu cầu không tồn tại hoặc đã được tiếp nhận trước đó.', 404);
    }

    const selectedAt = new Date();
    await assertReceiverClaimLimit(pendingRequest.receiver_id, selectedAt, 'Receiver này');
    let updated = null;
    let createdDonation = null;
    try {
      updated = await FoodRequest.findOneAndUpdate(
        {
          _id: requestId,
          status: 'PENDING',
        },
        {
          $set: {
            status: 'ACCEPTED',
            accepted_by_donor_id: donorId,
          },
        },
        { new: true }
      );

      if (!updated) {
        throw this._error('Yêu cầu không tồn tại hoặc đã được tiếp nhận trước đó.', 404);
      }

      const foodType = this._resolveFoodTypeFromRequest(updated);
      const expirationDatetime = this._resolveExpirationDatetimeFromRequest(updated);

      createdDonation = await FoodDonation.create({
        donor_id: donorId,
        selected_receiver_id: updated.receiver_id,
        selected_at: selectedAt,
        receiver_claim_history: [{ receiver_id: updated.receiver_id, claimed_at: selectedAt }],
        title: updated.title,
        description: updated.description || null,
        food_type: foodType,
        quantity: updated.requested_quantity,
        unit: updated.unit || 'portion',
        expiration_datetime: expirationDatetime,
        status: 'PENDING',
      });

      await FoodRequest.updateOne(
        { _id: updated._id },
        { $set: { linked_donation_id: createdDonation._id } },
      );
    } catch (err) {
      if (createdDonation?._id) {
        await FoodDonation.deleteOne({ _id: createdDonation._id, donor_id: donorId }).catch(() => {});
      }

      if (updated?._id) {
        await FoodRequest.updateOne(
          { _id: updated._id, linked_donation_id: null },
          {
            $set: {
              status: 'PENDING',
              accepted_by_donor_id: null,
            },
          },
        ).catch(() => {});
      }

      if (err.statusCode === 404) throw err;

      throw this._error('Không thể tạo đơn từ yêu cầu này. Vui lòng thử lại.', 500);
    }

    try {
      const donor = await User.findById(donorId).select('full_name').lean();
      const donorName = donor?.full_name || 'Donor';

      await NotificationService.dispatch({
        userIds: updated.receiver_id,
        key: 'request.accepted',
        params: { donorName },
        type: 'FOOD_REQUEST_ACCEPTED',
        data: {
          request_id: String(updated._id),
          donation_id: String(createdDonation._id),
          donor_id: String(donorId),
          click_action: 'NOTIFICATIONS_SCREEN',
        },
        related_entity_type: 'FoodDonation',
        related_entity_id: createdDonation._id,
      });
    } catch (notifyErr) {
      console.error('Accept request notification failed:', notifyErr?.message || notifyErr);
    }

    const finalRequest = await FoodRequest.findById(updated._id)
      .populate('linked_donation_id', 'title status delivery_type delivery_id')
      .lean();

    return finalRequest || updated;
  }

  static async deleteMyRequest(requestId, receiverId) {
    const deleted = await FoodRequest.findOneAndDelete({
      _id: requestId,
      receiver_id: receiverId,
      linked_donation_id: null,
      status: { $in: ['PENDING', 'ACCEPTED', 'CANCELLED'] },
    });

    if (!deleted) {
      throw this._error('Yêu cầu không tồn tại, đã được ghép đơn, hoặc bạn không có quyền xoá.', 404);
    }

    return deleted;
  }
}

module.exports = FoodRequestService;
