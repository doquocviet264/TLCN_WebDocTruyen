// app/validators/user.validators.js
const { body, param, query } = require("express-validator");

const updateProfileValidator = [
  body("username").optional().isString().trim().isLength({ min: 1 }),
  body("gender").optional().isIn(["male","female","other"]),
  body("birthday").optional().isISO8601(),
];

const changePasswordValidator = [
  body("currentPassword").isString().notEmpty(),
  body("newPassword").isString().isLength({ min: 6 }),
];

const adminUsersListValidator = [ query("page").optional().isInt({ min: 1 }) ];

const toggleStatusValidator = [
  param("userId").isInt({ min: 1 }),
  param("action").isIn(["suspend","activate"]),
];

const promoteValidator = [ param("userId").isInt({ min: 1 }) ];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
  adminUsersListValidator,
  toggleStatusValidator,
  promoteValidator,
};
