const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const ReportController = require('../controllers/reportController');

router.use(authMiddleware);

// Người dùng đã đăng nhập gửi báo cáo vi phạm
router.post('/', ReportController.createReport);

// Quản trị viên xem và xử lý báo cáo
router.get('/',      adminMiddleware, ReportController.listReports);
router.patch('/:id', adminMiddleware, ReportController.resolveReport);

module.exports = router;
