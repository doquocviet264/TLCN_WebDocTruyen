// app/validators/validateRequest.js
const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

module.exports = function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError("Unprocessable Entity", 422, "VALIDATION_ERROR");
  }
  next();
};
