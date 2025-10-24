// app/validators/quest.validators.js
const { body, param } = require("express-validator");

const claimValidator = [ param("userQuestId").isInt({ min: 1 }) ];

const progressValidator = [
  body("category").isString().notEmpty(),
  body("amount").optional().isInt({ min: 1, max: 1000 }),
];

module.exports = { claimValidator, progressValidator };
