const FeedbackService = require('../services/feedbackService');

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
