// app/routes/auth.routes.js
const express = require("express");
const { sequelize, models } = require("../db");
const userRepo = require("../repositories/user.repo");
const authServiceFactory = require("../services/auth.service");
const authControllerFactory = require("../controllers/auth.controller");
const validateRequest = require("../validators/validateRequest");

const {
  registerValidator,
  resendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth.validators");

const router = express.Router();

const authService = authServiceFactory({ sequelize, model: models, userRepo });
const authController = authControllerFactory(authService);

// POST /api/auth/register

/**
 * @openapi
 * components:
 *   schemas:
 *     OkEnvelope:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           nullable: true
 *         meta:
 *           nullable: true
 *     ErrorEnvelope:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             message: { type: string, example: "Unprocessable Entity" }
 *             code:    { type: string, example: "VALIDATION_ERROR" }
 *             status:  { type: integer, example: 422 }
 *     RegisterBody:
 *       type: object
 *       required: [username, email, password, confirmPassword]
 *       properties:
 *         username: { type: string, example: "vietdo" }
 *         email:    { type: string, format: email, example: "user@example.com" }
 *         password: { type: string, example: "secret123" }
 *         confirmPassword: { type: string, example: "secret123" }
 *     ResendOtpBody:
 *       type: object
 *       required: [email]
 *       properties:
 *         email: { type: string, format: email, example: "user@example.com" }
 *     VerifyOtpBody:
 *       type: object
 *       required: [email, otp]
 *       properties:
 *         email: { type: string, format: email, example: "user@example.com" }
 *         otp:   { type: string, example: "123456" }
 *     LoginBody:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:    { type: string, format: email, example: "user@example.com" }
 *         password: { type: string, example: "secret123" }
 *     LoginData:
 *       type: object
 *       properties:
 *         token: { type: string, example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 *         role:  { type: string, example: "USER" }
 *     ForgotPasswordBody:
 *       type: object
 *       required: [email]
 *       properties:
 *         email: { type: string, format: email, example: "user@example.com" }
 *     ResetPasswordBody:
 *       type: object
 *       required: [token, newPassword]
 *       properties:
 *         token:       { type: string, example: "abcdef123456..." }
 *         newPassword: { type: string, example: "newSecret123" }
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản, gửi OTP qua email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       200:
 *         description: Đăng ký thành công, chờ xác thực OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkEnvelope'
 *       409:
 *         description: Email/Username đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/register", registerValidator, validateRequest, authController.register);
//  POST /api/auth/resend-otp
/**
 * @openapi
 * /auth/resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Gửi lại mã OTP đến email đã đăng ký (chưa xác thực)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendOtpBody'
 *     responses:
 *       200:
 *         description: OTP mới đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkEnvelope'
 *       400:
 *         description: Không tìm thấy người dùng / đã xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/resend-otp", resendOtpValidator, validateRequest, authController.resendOTP);
// @route POST /api/auth/verify-otp
/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Xác thực tài khoản bằng OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpBody'
 *     responses:
 *       200:
 *         description: Xác thực thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkEnvelope'
 *       400:
 *         description: OTP không hợp lệ / đã hết hạn / không tìm thấy user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/verify-otp", verifyOtpValidator, validateRequest, authController.verifyOTP);
// @route POST /api/auth/login
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập (yêu cầu tài khoản đã xác thực)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Trả về JWT token và role
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginData'
 *       400:
 *         description: Sai thông tin đăng nhập / chưa xác thực
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/login", loginValidator, validateRequest, authController.login);
// @route POST /api/auth/forgot-password
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Yêu cầu đặt lại mật khẩu, gửi link qua email (hết hạn 10 phút)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordBody'
 *     responses:
 *       200:
 *         description: Link đặt lại mật khẩu đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkEnvelope'
 *       400:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/forgot-password", forgotPasswordValidator, validateRequest, authController.forgotPassword);
// @route POST /api/auth/reset-password
/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Đặt lại mật khẩu bằng token từ email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordBody'
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkEnvelope'
 *       400:
 *         description: Token không hợp lệ / hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/reset-password", resetPasswordValidator, validateRequest, authController.resetPassword);

module.exports = router;
