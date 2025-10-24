// app/validators/history.validators.js
const { body, param, query } = require("express-validator");

const updateValidator = [
  body("comicId").isInt({ min: 1 }),
  body("chapterId").isInt({ min: 1 }),
];

const listValidator = [
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const deleteByComicValidator = [
  param("comicId").isInt({ min: 1 }),
];

module.exports = { updateValidator, listValidator, deleteByComicValidator };
