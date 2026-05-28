const FeedbackService = require('../services/feedbackService');
const Feedback = require('../models/feedbackModel');

class FeedbackController {
    // GET /api/feedback/donation/:donationId
    static async getReceiverFeedbackContext(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chi Receiver moi co the feedback.' });
            }

            const data = await FeedbackService.getReceiverFeedbackContext(req.params.donationId, req.user.id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // GET /api/feedback (ADMIN)
    static async listAllFeedback(req, res) {
        try {
            const feedback = await Feedback.find()
                .sort({ createdAt: -1 })
                .populate('from_user_id', 'full_name avatar_url role')
                .populate('to_user_id', 'full_name avatar_url role')
                .lean();
            return res.status(200).json({ success: true, data: feedback });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // POST /api/feedback/donation/:donationId
    static async submitReceiverFeedback(req, res) {
        try {
            if (req.user.role !== 'RECEIVER') {
                return res.status(403).json({ success: false, message: 'Chi Receiver moi co the feedback.' });
            }

            const result = await FeedbackService.submitReceiverFeedback(req.params.donationId, req.user.id, req.body);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }
}

module.exports = FeedbackController;
