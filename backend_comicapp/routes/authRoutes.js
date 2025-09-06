const express = require('express');
const { body } = require('express-validator');
const { register, verifyOTP, login, forgotPassword, resetPassword, resendOTP } = require('../controllers/authController');

const router = express.Router();

// Đăng ký
router.post('/register', [
  body('username').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('confirmPassword').isLength({ min: 6 }),
], register);
//Gửi lại OTP
router.post('/resend-otp', resendOTP);
// Xác nhận OTP
router.post('/verify-otp', verifyOTP);

// Đăng nhập
router.post('/login', [
  body('email').isEmail(),
  body('password').exists(),
], login);

// Quên mật khẩu
router.post('/forgot-password', forgotPassword);

// Reset mật khẩu (gọi từ frontend sau khi click link)
router.post('/reset-password', resetPassword);

module.exports = router;