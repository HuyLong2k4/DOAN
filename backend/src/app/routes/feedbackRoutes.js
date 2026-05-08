const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const FeedbackController = require('../controllers/feedbackController');

router.use(authMiddleware);

router.get('/donation/:donationId', FeedbackController.getReceiverFeedbackContext);
router.post('/donation/:donationId', FeedbackController.submitReceiverFeedback);

module.exports = router;
