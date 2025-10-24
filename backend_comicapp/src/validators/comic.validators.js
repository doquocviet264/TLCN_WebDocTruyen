const { param, query, body } = require("express-validator");

const slugParam = [ param("slug").isString().notEmpty() ];
const idParam = [ param("comicId").isInt({ min: 1 }) ];

const searchValidator = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sortBy").optional().isIn(["newest","rating","oldest","popular"]),
];

module.exports = {
  slugParam, idParam, 
  searchValidator, 
};
