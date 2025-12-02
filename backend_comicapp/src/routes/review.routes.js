// app/routes/review.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const reviewServiceFactory = require("../services/review.service");
const reviewControllerFactory = require("../controllers/review.controller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

const reviewService = reviewServiceFactory({ sequelize, model: models });
const reviewController = reviewControllerFactory(reviewService);

/**
 * @openapi
 * components:
 *   schemas:
 *     ReviewDraftSaveBody:
 *       type: object
 *       required: [ chapterId, scriptData]
 *       properties:
 *         chapterId:
 *           type: integer
 *           example: 5
 *         scriptData:
 *           type: array
 *           description: "Danh sách các đoạn thoại/kịch bản"
 *           items:
 *             type: object
 *             properties:
 *               speaker:
 *                 type: string
 *                 example: "Nhân vật A"
 *               text:
 *                 type: string
 *                 example: "Xin chào, đây là đoạn thoại ví dụ."
 *               audioUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://res.cloudinary.com/.../audio_123.mp3"
 *               startTime:
 *                 type: number
 *                 nullable: true
 *                 example: 0
 *               endTime:
 *                 type: number
 *                 nullable: true
 *                 example: 3.5
 *
 *     ReviewDraftSaveData:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Lưu bản nháp thành công"
 *
 *     ReviewDraftGetData:
 *       type: object
 *       properties:
 *         scriptData:
 *           type: array
 *           nullable: true
 *           description: "Nếu chưa có bản nháp sẽ trả về null"
 *           items:
 *             type: object
 *             properties:
 *               speaker:
 *                 type: string
 *               text:
 *                 type: string
 *               audioUrl:
 *                 type: string
 *                 nullable: true
 *               startTime:
 *                 type: number
 *                 nullable: true
 *               endTime:
 *                 type: number
 *                 nullable: true
 *
 *     ReviewTtsBody:
 *       type: object
 *       required: [text]
 *       properties:
 *         text:
 *           type: string
 *           example: "Xin chào, mình là nhân vật A."
 *         voiceId:
 *           type: string
 *           nullable: true
 *           example: "female_01"
 *
 *     ReviewTtsData:
 *       type: object
 *       properties:
 *         audioUrl:
 *           type: string
 *           example: "https://res.cloudinary.com/.../audio_123.mp3"
 *         duration:
 *           type: number
 *           example: 3.52
 */

/**
 * @openapi
 * /reviews/draft:
 *   post:
 *     tags: [Review]
 *     summary: Lưu hoặc cập nhật bản nháp review cho một chapter
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewDraftSaveBody'
 *     responses:
 *       200:
 *         description: Lưu bản nháp thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReviewDraftSaveData'
 *       400:
 *         description: Thiếu dữ liệu hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/draft", protect, reviewController.saveDraft);

/**
 * @openapi
 * /reviews/draft/{chapterId}:
 *   get:
 *     tags: [Review]
 *     summary: Lấy bản nháp review cho một chapter của user hiện tại
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của chapter
 *     responses:
 *       200:
 *         description: Lấy bản nháp thành công (có thể null nếu chưa có)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReviewDraftGetData'
 *       400:
 *         description: Thiếu hoặc sai chapterId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.get("/draft/:chapterId", reviewController.getDraft);

/**
 * @openapi
 * /reviews/tts-preview:
 *   post:
 *     tags: [Review]
 *     summary: Preview TTS cho 1 câu thoại (KHÔNG lưu Cloudinary)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string, example: "Xin chào, mình là nhân vật A." }
 *               voiceId: { type: string, example: "kore" }
 *     responses:
 *       200:
 *         description: Trả về base64 audio + mimeType + duration
 */
router.post(
  "/tts-preview",
  // ttsPreviewValidator,
  // validateRequest,
  reviewController.ttsPreview
);

/**
 * @openapi
 * /reviews/publish:
 *   post:
 *     tags: [Review]
 *     summary: Xuất bản review audio cho 1 chapter
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chapterId]
 *             properties:
 *               chapterId: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: Xuất bản thành công, trả về timeline và tổng thời lượng
 */
router.post(
  "/publish",
  // publishValidator,
  // validateRequest,
  reviewController.publishReview
);

/**
 * @openapi
 * /reviews/published/{chapterId}:
 *   get:
 *     tags: [Review]
 *     summary: Lấy thông tin review đã xuất bản (audio + timeline) cho chapter
 *     parameters:
 *       - name: chapterId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Thông tin review đã xuất bản
 */
router.get(
  "/published/:chapterId",
  reviewController.getPublished
);

/**
 * @openapi
 * /reviews/generate-dialogues-ai:
 *   post:
 *     tags: [Review]
 *     summary: Dùng AI (Gemini Vision) để tạo kịch bản thoại từ ảnh
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl: { type: string, example: "https://res.cloudinary.com/..." }
 *     responses:
 *       200:
 *         description: Trả về danh sách các câu thoại do AI tạo ra
 */
router.post(
  "/generate-dialogues-ai",
  protect,
  reviewController.generateDialoguesAI
);

module.exports = router;
