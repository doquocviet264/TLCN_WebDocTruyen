// app/validators/application.validators.js
const { body, param, query } = require('express-validator');

// Validate đơn đăng ký làm dịch giả
const createBecomeTranslatorValidator = [
  body('reason')
    .optional()
    .isString().withMessage('Lý do phải là dạng chuỗi ký tự')
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Lý do phải có độ dài từ 10 đến 1000 ký tự'),
];

// Validate đơn xin gia nhập nhóm
const createJoinGroupValidator = [
  body('groupId')
    .notEmpty().withMessage('ID nhóm là bắt buộc')
    .isInt({ gt: 0 }).withMessage('ID nhóm phải là số nguyên dương'),
  body('reason')
    .optional()
    .isString().withMessage('Lý do phải là dạng chuỗi ký tự')
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Lý do phải có độ dài từ 10 đến 1000 ký tự'),
];

// Validate tham số applicationId
const applicationIdValidator = [
  param('applicationId')
    .notEmpty().withMessage('ID đơn đăng ký là bắt buộc')
    .isInt({ gt: 0 }).withMessage('ID đơn đăng ký phải là số nguyên dương'),
];

// Validate tham số groupId
const groupIdValidator = [
  param('groupId')
    .notEmpty().withMessage('ID nhóm là bắt buộc')
    .isInt({ gt: 0 }).withMessage('ID nhóm phải là số nguyên dương'),
];

// Validate body khi duyệt đơn (status)
const updateStatusValidator = [
  body('status')
    .notEmpty().withMessage('Trạng thái phê duyệt là bắt buộc')
    .isIn(['approved', 'rejected']).withMessage('Trạng thái không hợp lệ. Chỉ chấp nhận "approved" hoặc "rejected".'),
];

// Validate query params cho danh sách
const listValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected']).withMessage('Trạng thái lọc không hợp lệ'),
  query('page')
    .optional()
    .isInt({ gt: 0 }).withMessage('Số trang (page) phải là số nguyên dương')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ gt: 0, le: 100 }).withMessage('Giới hạn (limit) phải là số nguyên dương và tối đa 100')
    .toInt(),
];

module.exports = {
  createBecomeTranslatorValidator,
  createJoinGroupValidator,
  applicationIdValidator,
  groupIdValidator,
  updateStatusValidator,
  listValidator,
};