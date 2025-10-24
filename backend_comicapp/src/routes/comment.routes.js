// app/routes/comment.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const commentRepo = require("../repositories/comment.repo");
const commentLikeRepo = require("../repositories/comment-like.repo");
const notificationRepo = require("../repositories/notification.repo");
const reportRepo = require("../repositories/report.repo");

const commentServiceFactory = require("../services/comment.service");
const commentControllerFactory = require("../controllers/comment.controller");

const validateRequest = require("../validators/validateRequest");
const { protect, optionalAuth, isAdmin } = require("../middlewares/auth");

const {
  listByComicValidator,
  createCommentValidator,
  toggleLikeValidator,
  listByChapterValidator,
  adminListValidator,
  adminDeleteValidator,
} = require("../validators/comment.validators");

const router = express.Router();

const commentService = commentServiceFactory({
  sequelize,
  model: models,
  repos: { commentRepo, commentLikeRepo, notificationRepo, reportRepo },
});
const commentController = commentControllerFactory(commentService);

/**
 * @openapi
 * components:
 *   schemas:
 *     OkEnvelope:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         data: { nullable: true }
 *         meta: { nullable: true }
 *     ErrorEnvelope:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: false }
 *         error:
 *           type: object
 *           properties:
 *             message: { type: string, example: "VALIDATION_ERROR" }
 *             code: { type: string, example: "VALIDATION_ERROR" }
 *             status: { type: integer, example: 422 }
 *     CommentItem:
 *       type: object
 *       properties:
 *         commentId: { type: integer, example: 123 }
 *         comicId:   { type: integer, example: 55 }
 *         userId:    { type: integer, example: 7 }
 *         content:   { type: string, example: "Chapter này hay quá!" }
 *         parentId:  { type: integer, nullable: true, example: null }
 *         createdAt: { type: string, format: date-time }
 *         likes:     { type: integer, example: 4 }
 *         isLiked:   { type: boolean, example: false }
 *     CommentList:
 *       type: object
 *       properties:
 *         comments:
 *           type: array
 *           items: { $ref: '#/components/schemas/CommentItem' }
 *         meta:
 *           type: object
 *           properties:
 *             page: { type: integer, example: 1 }
 *             limit: { type: integer, example: 10 }
 *             total: { type: integer, example: 57 }
 *             totalPages: { type: integer, example: 6 }
 *     CreateCommentBody:
 *       type: object
 *       required: [comicId, content]
 *       properties:
 *         comicId: { type: integer, example: 55 }
 *         content: { type: string, example: "Hay quá!" }
 *         parentId: { type: integer, nullable: true, example: null }
 *         chapterId: { type: integer, nullable: true, example: 1234 }
 */

/**
 * @openapi
 * /comments/recent:
 *   get:
 *     tags: [Comments]
 *     summary: Lấy các bình luận mới nhất (public)
 *     responses:
 *       200:
 *         description: Danh sách bình luận mới nhất
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/recent", commentController.getRecentComments);

/**
 * @openapi
 * /comments/chapter/{chapterId}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Lấy danh sách bình luận theo ID chương (đăng nhập tùy chọn)
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của chương truyện cần lấy bình luận
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Trang hiện tại (phân trang)
 *     responses:
 *       200:
 *         description: Danh sách bình luận + thông tin phân trang
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CommentList'
 */
router.get(
  "/chapter/:chapterId",
  optionalAuth,
  listByChapterValidator,
  validateRequest,
  commentController.getCommentsByChapter
);


/**
 * @openapi
 * /comments/comic/{slug}:
 *   get:
 *     tags: [Comments]
 *     summary: Lấy bình luận theo slug truyện (đăng nhập tùy chọn)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Danh sách bình luận + phân trang
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/CommentList' }
 */
router.get("/comic/:slug", optionalAuth, listByComicValidator, validateRequest, commentController.getCommentsByComic);

/**
 * @openapi
 * /comments:
 *   post:
 *     tags: [Comments]
 *     summary: Tạo bình luận (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCommentBody' }
 *     responses:
 *       200:
 *         description: Tạo comment thành công (trả về comment vừa tạo)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Thiếu nội dung
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/", protect, createCommentValidator, validateRequest, commentController.createComment);

/**
 * @openapi
 * /comments/{commentId}/like:
 *   post:
 *     tags: [Comments]
 *     summary: Like/Unlike bình luận (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Trạng thái like sau thao tác
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.post("/:commentId/like", protect, toggleLikeValidator, validateRequest, commentController.toggleLikeComment);


module.exports = router;
