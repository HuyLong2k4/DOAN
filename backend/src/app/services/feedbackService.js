const Feedback = require('../models/feedbackModel');
const FoodDonation = require('../models/foodDonationModel');
const Delivery = require('../models/deliveryModel');

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
            throw this._error('Khong tim thay don quyen gop.', 404);
        }

        if (!donation.selected_receiver_id || String(donation.selected_receiver_id) !== String(receiverId)) {
            throw this._error('Ban khong co quyen feedback don nay.', 403);
        }

        if (!donation.delivery_id) {
            throw this._error('Don nay chua co thong tin van chuyen.', 400);
        }

        const delivery = await Delivery.findById(donation.delivery_id)
            .select('status delivery_type donor_id receiver_id volunteer_id')
            .populate('volunteer_id', 'full_name')
            .lean();

        if (!delivery) {
            throw this._error('Khong tim thay delivery cua don nay.', 404);
        }

        if (!delivery.receiver_id || String(delivery.receiver_id) !== String(receiverId)) {
            throw this._error('Ban khong co quyen feedback delivery nay.', 403);
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
            throw this._error('Chi duoc feedback sau khi da nhan hang thanh cong.', 400);
        }

        const donorRating = Number(payload?.donor_rating);
        const donorComment = payload?.donor_comment ? String(payload.donor_comment).trim() : '';
        const volunteerRating = payload?.volunteer_rating != null ? Number(payload.volunteer_rating) : null;
        const volunteerComment = payload?.volunteer_comment ? String(payload.volunteer_comment).trim() : '';

        if (!this._isValidRating(donorRating)) {
            throw this._error('donor_rating phai trong khoang 1 den 5.', 400);
        }

        if (context.volunteer && !this._isValidRating(volunteerRating)) {
            throw this._error('volunteer_rating phai trong khoang 1 den 5.', 400);
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

        return {
            message: 'Gui feedback thanh cong.',
            donation_id: String(context.donation._id),
            delivery_id: String(context.delivery._id),
        };
    }
}

module.exports = FeedbackService;
