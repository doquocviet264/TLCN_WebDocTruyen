// app/validators/report.validators.js
const { body, param, query } = require("express-validator");

const createReportValidator = [
  body("title").isString().notEmpty(),
  body("description").isString().notEmpty(),
  body("type").isIn(["comment", "chapter"]),
  body("targetId").isInt({ min: 1 }),
];



module.exports = {
  createReportValidator,
};
