const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const NotificationController = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/', NotificationController.getMyNotifications);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', NotificationController.markRead);

module.exports = router;
