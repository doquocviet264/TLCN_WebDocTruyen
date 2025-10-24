// app/routes/history.routes.js
const express = require("express");
const { sequelize, models } = require("../db");
const readingHistoryRepo = require("../repositories/reading-history.repo");
const chapterRepo = require("../repositories/chapter.repo");
const historyServiceFactory = require("../services/history.service");
const historyControllerFactory = require("../controllers/history.controller");
const validateRequest = require("../validators/validateRequest");
const { protect } = require("../middlewares/auth");

const {
  updateValidator,
  listValidator,
  deleteByComicValidator,
} = require("../validators/history.validators");

const router = express.Router();

const historyService = historyServiceFactory({
  sequelize,
  model: models,
  readingHistoryRepo,
  chapterRepo
});
const historyController = historyControllerFactory(historyService);

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
 *     UpdateHistoryBody:
 *       type: object
 *       required: [comicId, chapterId]
 *       properties:
 *         comicId: { type: integer, example: 55 }
 *         chapterId: { type: integer, example: 1203 }
 *     ReadingHistoryItem:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 55, description: "comicId" }
 *         title: { type: string, example: "One Piece" }
 *         slug: { type: string, example: "one-piece" }
 *         image: { type: string, example: "https://..." }
 *         lastChapter: { type: number, example: 1103 }
 *         chapterTitle: { type: string, example: "Wano Arc Finale" }
 *         lastReadAt: { type: string, format: date-time }
 */

/**
 * @openapi
 * /history/update:
 *   post:
 *     tags: [History]
 *     summary: Cập nhật / tạo lịch sử đọc (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateHistoryBody' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Thiếu comicId hoặc chapterId
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/update", protect, updateValidator, validateRequest, historyController.updateReadingHistory);

/**
 * @openapi
 * /history:
 *   get:
 *     tags: [History]
 *     summary: Lấy lịch sử đọc của người dùng (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: Danh sách lịch sử đọc (mới nhất trước)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ReadingHistoryItem' }
 */
router.get("/", protect, listValidator, validateRequest, historyController.getReadingHistory);

/**
 * @openapi
 * /history/{comicId}:
 *   get:
 *     tags:
 *       - History
 *     summary: Lấy lịch sử đọc cho 1 truyện cụ thể (yêu cầu đăng nhập)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 55
 *     responses:
 *       '200':
 *         description: Chi tiết lịch sử đọc cho 1 truyện.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReadingHistoryItem'
 *                       nullable: true
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         description: Không tìm thấy truyện hoặc lịch sử
 */
router.get(
  "/:comicId", 
  protect,
  deleteByComicValidator,
  validateRequest,
  historyController.getReadingHistoryByComic
);

/**
 * @openapi
 * /history/clear:
 *   delete:
 *     tags: [History]
 *     summary: Xoá toàn bộ lịch sử đọc của người dùng (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Đã xóa toàn bộ lịch sử
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.delete("/clear", protect, historyController.clearReadingHistory);

/**
 * @openapi
 * /history/{comicId}:
 *   delete:
 *     tags: [History]
 *     summary: Xoá lịch sử đọc theo Comic (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema: { type: integer, example: 55 }
 *     responses:
 *       200:
 *         description: Đã xóa lịch sử đọc của truyện
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy lịch sử đọc của truyện này
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.delete("/:comicId", protect, deleteByComicValidator, validateRequest, historyController.deleteReadingHistoryByComic);

module.exports = router;
