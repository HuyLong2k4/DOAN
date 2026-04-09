const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Public routes
router.post('/', UserController.createUser);

// Leaderboard — authenticated, any role
router.get('/leaderboard', authMiddleware, UserController.getLeaderboard);

// Protected routes - cần authentication
router.patch('/:id/change-password', authMiddleware, UserController.changePassword);
router.get('/:id', authMiddleware, UserController.getUserById);
router.patch('/:id', authMiddleware, UserController.updateUser);
router.delete('/:id', authMiddleware, UserController.deleteUser);

// Admin only routes
router.get('/', authMiddleware, adminMiddleware, UserController.getAllUsers);

module.exports = router;