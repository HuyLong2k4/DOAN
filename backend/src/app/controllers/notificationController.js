const Notification = require('../models/notificationModel');

class NotificationController {
  static async getMyNotifications(req, res) {
    try {
      const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 200));
      const data = await Notification.find({ user_id: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({ success: true, data });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  static async markRead(req, res) {
    try {
      const item = await Notification.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user.id },
        { $set: { is_read: true } },
        { new: true },
      ).lean();

      if (!item) {
        return res.status(404).json({ success: false, message: 'Notification not found.' });
      }

      return res.status(200).json({ success: true, data: item });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }

  static async markAllRead(req, res) {
    try {
      const result = await Notification.updateMany(
        { user_id: req.user.id, is_read: false },
        { $set: { is_read: true } },
      );

      return res.status(200).json({
        success: true,
        data: {
          modified_count: result.modifiedCount || 0,
        },
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = NotificationController;
