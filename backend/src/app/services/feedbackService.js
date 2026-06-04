const Feedback = require('../models/feedbackModel');
const FoodDonation = require('../models/foodDonationModel');
const Delivery = require('../models/deliveryModel');
const NotificationService = require('./notificationService');
const User = require('../models/userModel');

class FeedbackService {
    static _error(message, statusCode = 400) {
        return Object.assign(new Error(message), { statusCode });
    }

    static _toId(value) {
        if (!value) return null;
        if (typeof value === 'string') return value;
        return String(value._id || value);
    }

    static _isValidRating(value) {
        const rating = Number(value);
        return Number.isInteger(rating) && rating >= 1 && rating <= 5;
    }

    static async _loadReceiverDonationContext(donationId, receiverId) {
        const donation = await FoodDonation.findById(donationId)
            .select('title donor_id selected_receiver_id delivery_id delivery_type status')
            .populate('donor_id', 'full_name')
            .lean();

        if (!donation) {
            throw this._error('Không tìm thấy đơn quyên góp.', 404);
        }

        if (!donation.selected_receiver_id || String(donation.selected_receiver_id) !== String(receiverId)) {
            throw this._error('Bạn không có quyền feedback đơn này.', 403);
        }

        if (!donation.delivery_id) {
            throw this._error('Đơn này chưa có thông tin vận chuyển.', 400);
        }

        const delivery = await Delivery.findById(donation.delivery_id)
            .select('status delivery_type donor_id receiver_id volunteer_id')
            .populate('volunteer_id', 'full_name')
            .lean();

        if (!delivery) {
            throw this._error('Không tìm thấy delivery của đơn này.', 404);
        }

        if (!delivery.receiver_id || String(delivery.receiver_id) !== String(receiverId)) {
            throw this._error('Bạn không có quyền feedback delivery này.', 403);
        }

        const isCompleted = delivery.status === 'DELIVERED' && donation.status === 'COMPLETED';

        const donorId = this._toId(delivery.donor_id) || this._toId(donation.donor_id);
        const donorName = donation?.donor_id?.full_name || 'Donor';

        const volunteerId = this._toId(delivery.volunteer_id);
        const volunteerName = delivery?.volunteer_id?.full_name || null;

        const existing = await Feedback.find({
            delivery_id: delivery._id,
            from_user_id: receiverId,
        })
            .select('to_user_id rating comment')
            .lean();

        const existingByToUser = new Map(existing.map((item) => [String(item.to_user_id), item]));

        const donorFeedback = donorId ? existingByToUser.get(String(donorId)) : null;
        const volunteerFeedback = volunteerId ? existingByToUser.get(String(volunteerId)) : null;

        return {
            donation,
            delivery,
            isCompleted,
            donor: {
                id: donorId,
                full_name: donorName,
            },
            volunteer: volunteerId
                ? {
                    id: volunteerId,
                    full_name: volunteerName || 'Volunteer',
                }
                : null,
            existing_feedback: {
                donor_rating: donorFeedback?.rating || null,
                donor_comment: donorFeedback?.comment || '',
                volunteer_rating: volunteerFeedback?.rating || null,
                volunteer_comment: volunteerFeedback?.comment || '',
            },
        };
    }

    static async getReceiverFeedbackContext(donationId, receiverId) {
        const context = await this._loadReceiverDonationContext(donationId, receiverId);

        return {
            donation_id: String(context.donation._id),
            donation_title: context.donation.title,
            delivery_id: String(context.delivery._id),
            can_feedback: context.isCompleted,
            is_completed: context.isCompleted,
            points_earned: 100,
            donor: context.donor,
            volunteer: context.volunteer,
            existing_feedback: context.existing_feedback,
        };
    }

    static async submitReceiverFeedback(donationId, receiverId, payload) {
        const context = await this._loadReceiverDonationContext(donationId, receiverId);

        if (!context.isCompleted) {
            throw this._error('Chỉ được feedback sau khi đã nhận hàng thành công.', 400);
        }

        const donorRating = Number(payload?.donor_rating);
        const donorComment = payload?.donor_comment ? String(payload.donor_comment).trim() : '';
        const volunteerRating = payload?.volunteer_rating != null ? Number(payload.volunteer_rating) : null;
        const volunteerComment = payload?.volunteer_comment ? String(payload.volunteer_comment).trim() : '';

        if (!this._isValidRating(donorRating)) {
            throw this._error('donor_rating phải trong khoảng 1 đến 5.', 400);
        }

        if (context.volunteer && !this._isValidRating(volunteerRating)) {
            throw this._error('volunteer_rating phải trong khoảng 1 đến 5.', 400);
        }

        const upsertOps = [];

        if (context.donor.id) {
            upsertOps.push(
                Feedback.findOneAndUpdate(
                    {
                        delivery_id: context.delivery._id,
                        from_user_id: receiverId,
                        to_user_id: context.donor.id,
                    },
                    {
                        delivery_id: context.delivery._id,
                        from_user_id: receiverId,
                        to_user_id: context.donor.id,
                        rating: donorRating,
                        comment: donorComment || null,
                    },
                    { upsert: true, new: true, runValidators: true },
                ),
            );
        }

        if (context.volunteer?.id) {
            upsertOps.push(
                Feedback.findOneAndUpdate(
                    {
                        delivery_id: context.delivery._id,
                        from_user_id: receiverId,
                        to_user_id: context.volunteer.id,
                    },
                    {
                        delivery_id: context.delivery._id,
                        from_user_id: receiverId,
                        to_user_id: context.volunteer.id,
                        rating: Number(volunteerRating),
                        comment: volunteerComment || null,
                    },
                    { upsert: true, new: true, runValidators: true },
                ),
            );
        }

        await Promise.all(upsertOps);

        await this._notifyReviewTargets(context, receiverId, {
            donorRating,
            donorComment,
            volunteerRating,
            volunteerComment,
        });

        return {
            message: 'Gửi feedback thành công.',
            donation_id: String(context.donation._id),
            delivery_id: String(context.delivery._id),
        };
    }

    /**
     * Báo cho donor/volunteer khi LẦN ĐẦU nhận đánh giá từ receiver. Bỏ qua khi
     * receiver sửa lại đánh giá cũ (existing_feedback đã có rating) để tránh spam.
     * Nội dung nhúng luôn số sao + bình luận để xem ngay trong thông báo, không
     * cần màn riêng. Fire-and-forget — lỗi notify không làm hỏng việc gửi feedback.
     */
    static async _notifyReviewTargets(context, receiverId, ratings) {
        const targets = [];
        if (context.donor.id && context.existing_feedback.donor_rating == null) {
            targets.push({ userId: context.donor.id, rating: ratings.donorRating, comment: ratings.donorComment });
        }
        if (context.volunteer?.id && context.existing_feedback.volunteer_rating == null) {
            targets.push({ userId: context.volunteer.id, rating: Number(ratings.volunteerRating), comment: ratings.volunteerComment });
        }
        if (targets.length === 0) return;

        const donationTitle = context.donation.title || 'đơn quyên góp';
        const receiver = await User.findById(receiverId).select('full_name').lean().catch(() => null);
        const receiverName = receiver?.full_name || 'Receiver';

        // Dispatch riêng từng người vì rating/comment (cho donor vs volunteer) khác nhau.
        await Promise.all(
            targets.map((t) =>
                NotificationService.dispatch({
                    userIds: t.userId,
                    key: t.comment ? 'feedback.receivedWithComment' : 'feedback.received',
                    params: { receiverName, rating: t.rating, title: donationTitle, comment: t.comment },
                    type: 'FEEDBACK_RECEIVED',
                    data: { donation_id: String(context.donation._id) },
                    related_entity_type: 'FoodDonation',
                    related_entity_id: context.donation._id,
                }),
            ),
        );
    }
}

module.exports = FeedbackService;
