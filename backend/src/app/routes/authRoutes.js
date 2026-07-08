const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

//  Public routes 
// UI: Sign Up Page
router.post('/signup',           AuthController.signup);

// UI: OTP Screen (purpose: SIGNUP | RESET_PASSWORD)
router.post('/verify-otp',       AuthController.verifyOtp);
router.post('/resend-otp',       AuthController.resendOtp);

router.post('/login',            AuthController.login);

// UI: Forgot Password → OTP → Reset Password
router.post('/forgot-password',  AuthController.forgotPassword);
router.post('/reset-password',   AuthController.resetPassword);

// Protected routes (cần JWT)
// UI: Select Profile (Donor / Receiver / Volunteer)
router.post('/select-role',      authMiddleware, AuthController.selectRole);

router.post('/logout',           authMiddleware, AuthController.logout);

module.exports = router;