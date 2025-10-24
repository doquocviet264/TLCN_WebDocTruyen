// app/validators/notification.validators.js
const { param, query } = require("express-validator");

const listValidator = [
  query("sinceDays").optional().isInt({ min: 1, max: 180 }),
  query("limit").optional().isInt({ min: 1, max: 200 }),
  query("page").optional().isInt({ min: 1 }),
];

const markOneValidator = [ param("notificationId").isInt({ min: 1 }) ];

module.exports = { listValidator, markOneValidator };
