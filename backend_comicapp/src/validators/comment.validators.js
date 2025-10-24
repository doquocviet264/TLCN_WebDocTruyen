// app/validators/comment.validators.js
const { body, param, query } = require("express-validator");

const listByChapterValidator = [
  param("chapterId").isInt({ min: 1 }),
  query("page").optional().isInt({ min: 1 }),
];
const listByComicValidator = [
  param("slug").isString().notEmpty(),
  query("page").optional().isInt({ min: 1 }),
];

const createCommentValidator = [
  body("comicId").isInt({ min: 1 }),
  body("content").isString().notEmpty(),
  body("parentId").optional({ nullable: true }).isInt({ min: 1 }),
  body("chapterId").optional({ nullable: true }).isInt({ min: 1 }),
];

const toggleLikeValidator = [ param("commentId").isInt({ min: 1 }) ];


module.exports = {
  listByComicValidator,
  createCommentValidator,
  listByChapterValidator,
  toggleLikeValidator,
};
