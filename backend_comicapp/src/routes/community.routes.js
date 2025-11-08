const express = require("express");
const { sequelize, models } = require("../db");

// Repos (kiểu module thuần, truyền vào service như bạn làm ở notification)
const postRepo = require("../repositories/post.repo");
const postLikeRepo = require("../repositories/postLike.repo");
const postCommentRepo = require("../repositories/postComment.repo");

// Service & Controller factories (giống auth/notification)
const communityServiceFactory = require("../services/community.service");
const communityControllerFactory = require("../controllers/community.controller");

// Middlewares & Validators
const validateRequest = require("../validators/validateRequest");
const {
  createPostValidator,
  queryPostsValidator,
  postIdParam,
  createCommentValidator,
} = require("../validators/community.validators");
const { protect, optionalAuth } = require("../middlewares/auth");
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB mỗi ảnh
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ được upload ảnh"));
    }
    cb(null, true);
  },
});

const router = express.Router();

// Khởi tạo service & controller ngay trong route (match notification.routes.js)
const communityService = communityServiceFactory({
  sequelize,
  model: models,
  postRepo,
  postLikeRepo,
  postCommentRepo,
});
const communityController = communityControllerFactory(communityService);

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
 *             message: { type: string, example: "Không tìm thấy bài đăng" }
 *             code: { type: string, example: "NOT_FOUND" }
 *             status: { type: integer, example: 404 }
 *     PostItem:
 *       type: object
 *       properties:
 *         postId: { type: integer, example: 101 }
 *         userId: { type: integer, example: 7 }
 *         comicId: { type: integer, nullable: true, example: 3 }
 *         type: { type: string, enum: [review, find_similar] }
 *         title: { type: string, example: "Review Solo Leveling" }
 *         content: { type: string, example: "Truyện quá đỉnh!" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @openapi
 * /community/posts:
 *   post:
 *     tags: [Community]
 *     summary: Tạo bài đăng (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, enum: [review, find_similar] }
 *               title: { type: string }
 *               content: { type: string }
 *               comicId: { type: integer, nullable: true }
 *               genreIds:
 *                 type: array
 *                 items: { type: integer }
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     imageUrl: { type: string }
 *                     imageNumber: { type: integer }
 *     responses:
 *       200:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.post(
  "/posts",
  protect,
  upload.array("images", 5),
  createPostValidator,
  validateRequest,
  communityController.createPost
);

/**
 * @openapi
 * /community/posts:
 *   get:
 *     tags: [Community]
 *     summary: Lọc & tìm kiếm bài đăng
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [review, find_similar] }
 *       - in: query
 *         name: userId
 *         schema: { type: integer }
 *       - in: query
 *         name: comicId
 *         schema: { type: integer }
 *       - in: query
 *         name: genreIds
 *         schema: { type: string, example: "1,2,3" }
 *       - in: query
 *         name: genreMode
 *         schema: { type: string, enum: [any, all], example: any }
 *       - in: query
 *         name: minAvgRating
 *         schema: { type: number, format: float, example: 4.0 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [new, old, top, hot], example: new }
 *       - in: query
 *         name: lastDays
 *         schema: { type: integer, example: 7 }
 *       - in: query
 *         name: start
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: end
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 12 }
 *     responses:
 *       200:
 *         description: Danh sách bài đăng
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get(
  "/posts",
  optionalAuth,
  queryPostsValidator,
  validateRequest,
  communityController.listPosts
);

/**
 * @openapi
 * /community/posts/{postId}:
 *   get:
 *     tags: [Community]
 *     summary: Lấy chi tiết bài đăng
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Chi tiết bài đăng
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get(
  "/posts/:postId",
  optionalAuth,
  postIdParam,
  validateRequest,
  communityController.getPostById
);

/**
 * @openapi
 * /community/posts/{postId}/like:
 *   post:
 *     tags: [Community]
 *     summary: Thích bài đăng (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Đã thích
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *   delete:
 *     tags: [Community]
 *     summary: Bỏ thích bài đăng (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Đã bỏ thích
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.post(
  "/posts/:postId/like",
  protect,
  postIdParam,
  validateRequest,
  communityController.likePost
);
router.delete(
  "/posts/:postId/like",
  protect,
  postIdParam,
  validateRequest,
  communityController.unlikePost
);

/**
 * @openapi
 * /community/posts/{postId}/comments:
 *   post:
 *     tags: [Community]
 *     summary: Tạo bình luận (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content: { type: string }
 *               parentId: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Tạo bình luận thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *   get:
 *     tags: [Community]
 *     summary: Lấy danh sách bình luận của bài đăng
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: Danh sách bình luận
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.post(
  "/posts/:postId/comments",
  protect,
  createCommentValidator,
  validateRequest,
  communityController.createComment
);
router.get(
  "/posts/:postId/comments",
  postIdParam,
  validateRequest,
  communityController.getComments
);

/**
 * @openapi
 * /community/posts/{postId}/comments/{commentId}/replies:
 *   get:
 *     tags: [Community]
 *     summary: Lấy danh sách trả lời của một bình luận
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Danh sách trả lời
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get(
  "/posts/:postId/comments/:commentId/replies",
  postIdParam, // Re-use postIdParam for validation
  // You might need a separate validator for commentId if it has specific rules
  validateRequest,
  communityController.getCommentReplies
);

module.exports = router;
