const { body, query, param } = require("express-validator");

// tạo bài
const createPostValidator = [
  body("type").isIn(["review", "find_similar"]).withMessage("type không hợp lệ"),
  body("title").isString().trim().isLength({ min: 1 }).withMessage("title bắt buộc"),
  body("content").isString().trim().isLength({ min: 1 }).withMessage("content bắt buộc"),
  body("comicId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .toInt()
    .custom((value, { req }) => {
      if (req.body.type === "review" && !value) {
        throw new Error("comicId là bắt buộc khi type là review");
      }
      return true;
    }),

  // rating 1..5 (cho phép null)
  body("ratingStoryLine").optional({ nullable: true }).isInt({ min: 1, max: 5 }).toInt(),
  body("ratingCharacters").optional({ nullable: true }).isInt({ min: 1, max: 5 }).toInt(),
  body("ratingArt").optional({ nullable: true }).isInt({ min: 1, max: 5 }).toInt(),
  body("ratingEmotion").optional({ nullable: true }).isInt({ min: 1, max: 5 }).toInt(),
  body("ratingCreativity").optional({ nullable: true }).isInt({ min: 1, max: 5 }).toInt(),

  // genres & images
  body("genreIds").optional().isArray(),
  body("genreIds.*").optional().isInt({ min: 1 }),
  body("images").optional().isArray(),
  body("images.*.imageUrl").optional().isString().isLength({ min: 1, max: 500 }),
  body("images.*.imageNumber").optional().isInt({ min: 0, max: 32767 }),
];

// query list
const queryPostsValidator = [
  query("q").optional().isString().trim(),
  query("type").optional().isIn(["review", "find_similar"]),
  query("userId").optional().isInt({ min: 1 }),
  query("comicId").optional().isInt({ min: 1 }),
  query("genreIds").optional().isString().withMessage("genreIds dạng '1,2,3'"),
  query("genreMode").optional().isIn(["any", "all"]),
  query("minAvgRating").optional().isFloat({ min: 1, max: 5 }),
  query("sort").optional().isIn(["new", "old", "top", "hot"]),
  query("lastDays").optional().isInt({ min: 1, max: 365 }),
  query("start").optional().isISO8601(),
  query("end").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

const postIdParam = [param("postId").isInt({ min: 1 }).withMessage("postId không hợp lệ")];

const createCommentValidator = [
  ...postIdParam,
  body("content").isString().trim().isLength({ min: 1 }).withMessage("Nội dung bắt buộc"),
  body("parentId").optional({ nullable: true }).isInt({ min: 1 }),
];

module.exports = {
  createPostValidator,
  queryPostsValidator,
  postIdParam,
  createCommentValidator,
};
