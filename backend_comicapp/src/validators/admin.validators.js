// validators/admin.validators.js
const { param, query, body } = require("express-validator");

/* Common */
const idParam        = param("id").isInt({ min: 1 }).withMessage("id phải là số >= 1");
const comicIdParam   = param("comicId").isInt({ min: 1 }).withMessage("comicId phải là số >= 1");
const chapterIdParam = param("id").isInt({ min: 1 }).withMessage("chapterId phải là số >= 1");
const userIdParam    = param("userId").isInt({ min: 1 }).withMessage("userId phải là số >= 1");
const actionParam    = param("action").isIn(["suspend","activate"]).withMessage("action phải là suspend|activate");

const pagingQuery = [
  query("page").optional().isInt({ min: 1 }).withMessage("page phải là số >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit 1–100"),
];

/* Comics */
const createComicValidator = [
  body("title").isString().trim().notEmpty().withMessage("title bắt buộc"),
  body("description").isString().trim().notEmpty().withMessage("description bắt buộc"),
  body("genres").isArray({ min: 1 }).withMessage("genres phải là array tối thiểu 1 phần tử"),
  body("author").optional().isString(),
  body("status").optional().isString(),
  body("image").optional().isString(),
  body("aliases").optional().isArray(),
];

const updateComicValidator = [
  body("title").optional().isString().trim(),
  body("description").optional().isString().trim(),
  body("genres").optional().isArray(),
  body("author").optional().isString(),
  body("status").optional().isString(),
  body("image").optional().isString(),
  body("aliases").optional().isArray(),
];

const updateChapterValidator = [
  param("id").isInt({ min: 1 }),
  body("title").optional().isString(),
  body("chapterNumber").optional().custom((v) => !isNaN(parseFloat(v))),
  body("cost").optional().isInt({ min: 0 }),
  body("isLocked").optional().isBoolean(),
  body("images").optional().isArray(),
];

const addChapterValidator = [
  param("comicId").isInt({ min: 1 }).withMessage("ở đây"),
  body("chapterNumber").custom((v) => !isNaN(parseFloat(v))).withMessage("2"),
  body("cost").optional().isInt({ min: 0 }).withMessage("3"),
  body("isLocked").optional().isBoolean().withMessage("4"),
  body("images").optional().isArray().withMessage("5"),
];
const createAdminNotificationValidator = [
  body("category").isIn(["promotion", "system"]).withMessage("category phải là 'promotion' hoặc 'system'"),
  body("title").isString().trim().notEmpty().withMessage("title bắt buộc"),
  body("message").isString().trim().notEmpty().withMessage("message bắt buộc"),
];

/* Genres */
const createGenreValidator = [
  body("name").isString().trim().notEmpty().withMessage("name bắt buộc"),
];
const updateGenreValidator = [
  param("id").isInt({ min: 1 }), 
  body("name").isString().trim().notEmpty().withMessage("name bắt buộc"),
];

module.exports = {
  // common
  idParam, comicIdParam, chapterIdParam, userIdParam, actionParam, pagingQuery,
  // comics
  createComicValidator, updateComicValidator,
  // chapters
  updateChapterValidator, addChapterValidator,
  // genres
  createGenreValidator, updateGenreValidator,
  // notifications
  createAdminNotificationValidator,
};
