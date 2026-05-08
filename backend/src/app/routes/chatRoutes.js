const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');
const { uploadChatAttachment } = require('../middlewares/chatUploadMiddleware');

router.use(authMiddleware);

router.post('/direct/donation/:donationId', ChatController.getOrCreateDirectConversationByDonation);
router.post('/uploads', uploadChatAttachment.array('files', 5), ChatController.uploadAttachments);
router.get('/conversations', ChatController.listConversations);
router.get('/conversations/:id/messages', ChatController.getConversationMessages);
router.post('/conversations/:id/messages', ChatController.sendMessage);
router.post('/conversations/:id/read', ChatController.markConversationRead);

module.exports = router;
