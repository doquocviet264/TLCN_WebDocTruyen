// app/validators/auth.validators.js
const { body } = require("express-validator");

const registerValidator = [
  body("username").notEmpty().withMessage("username bắt buộc"),
  body("email").isEmail().withMessage("email không hợp lệ"),
  body("password").isLength({ min: 6 }).withMessage("password >= 6"),
  body("confirmPassword").isLength({ min: 6 }).withMessage("confirmPassword >= 6"),
];

const resendOtpValidator = [ body("email").isEmail() ];
const verifyOtpValidator = [
  body("email").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }).isNumeric(),
];

const loginValidator = [
  body("email").isEmail(),
  body("password").notEmpty(),
];

const forgotPasswordValidator = [ body("email").isEmail() ];

const resetPasswordValidator = [
  body("token").notEmpty(),
  body("newPassword").isLength({ min: 6 }),
];

module.exports = {
  registerValidator,
  resendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
