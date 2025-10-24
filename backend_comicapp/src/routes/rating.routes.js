// app/routes/rating.routes.js
const express = require("express");
const { models } = require("../db");

const comicRepo = require("../repositories/comic.repo");
const comicRatingRepo = require("../repositories/comic-rating.repo");

const ratingServiceFactory = require("../services/rating.service");
const ratingControllerFactory = require("../controllers/rating.controller");

const validateRequest = require("../validators/validateRequest");
const { getUserRatingValidator, upsertRatingValidator } = require("../validators/rating.validators");
const { protect } = require("../middlewares/auth");

const router = express.Router();

const ratingService = ratingServiceFactory({
  model: models,
  repos: { comicRepo, comicRatingRepo },
});
const ratingController = ratingControllerFactory(ratingService);

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
 *             message: { type: string, example: "Đánh giá không hợp lệ" }
 *             code: { type: string, example: "INVALID_RATING" }
 *             status: { type: integer, example: 400 }
 *     UserRatingData:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           nullable: true
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *     UpsertRatingBody:
 *       type: object
 *       required: [comicId, rating]
 *       properties:
 *         comicId: { type: integer, example: 101 }
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 */

/**
 * @openapi
 * /ratings/{comicId}/user:
 *   get:
 *     tags: [Ratings]
 *     summary: Lấy đánh giá hiện tại của người dùng cho 1 comic
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema: { type: integer, example: 101 }
 *     responses:
 *       200:
 *         description: Trả về rating hiện tại (null nếu chưa đánh giá)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserRatingData'
 *       404:
 *         description: Comic không tồn tại (trường hợp bạn muốn kiểm tra trước)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.get("/:comicId/user", protect, getUserRatingValidator, validateRequest, ratingController.getUserRating);

/**
 * @openapi
 * /ratings:
 *   post:
 *     tags: [Ratings]
 *     summary: Tạo hoặc cập nhật đánh giá (1-5) cho comic
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpsertRatingBody' }
 *     responses:
 *       200:
 *         description: Đánh giá thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Điểm đánh giá không hợp lệ (phải 1..5)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 *       404:
 *         description: Không tìm thấy comic
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/", protect, upsertRatingValidator, validateRequest, ratingController.createOrUpdateRating);

module.exports = router;
