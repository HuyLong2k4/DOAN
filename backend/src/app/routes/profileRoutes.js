const express = require('express');
const router  = express.Router();
const ProfileController = require('../controllers/profileController');
const authMiddleware    = require('../middlewares/authMiddleware');

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

// GET  /api/profile/me          → Lấy thông tin user + profile (dùng trên Home)
router.get('/me',                ProfileController.getMyProfile);

// GET  /api/profile/ngos-nearby  → Danh sách NGO (Receiver type NGO)
router.get('/ngos-nearby',       ProfileController.getNearbyNgos);

// POST /api/profile/donor       → Hoàn thành Donor profile (Donor Details form)
router.post('/donor',            ProfileController.completeDonorProfile);

// POST /api/profile/receiver    → Hoàn thành Receiver profile (Receiver Details form)
router.post('/receiver',         ProfileController.completeReceiverProfile);

// POST /api/profile/volunteer   → Hoàn thành Volunteer profile (Volunteer Details form)
router.post('/volunteer',        ProfileController.completeVolunteerProfile);

// PATCH /api/profile/volunteer/active-status → Volunteer bật/tắt nhận đơn
router.patch('/volunteer/active-status', ProfileController.toggleActiveStatus);

module.exports = router;
