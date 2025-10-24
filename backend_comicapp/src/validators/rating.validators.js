// app/validators/rating.validators.js
const { param, body } = require("express-validator");

const getUserRatingValidator = [
  param("comicId").isInt({ min: 1 }),
];

const upsertRatingValidator = [
  body("comicId").isInt({ min: 1 }),
  body("rating").isInt({ min: 1, max: 5 }),
];

module.exports = { getUserRatingValidator, upsertRatingValidator };
