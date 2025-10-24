// app/routes/chapter.routes.js
const express = require("express");
const { sequelize, models } = require("../db");
const chapterRepo = require("../repositories/chapter.repo");
const comicRepo = require("../repositories/comic.repo");
const chapterImageRepo = require("../repositories/chapterImage.repo");
const chapterUnlockRepo = require("../repositories/chapterUnlock.repo");
const walletRepo = require("../repositories/wallet.repo");
const transactionRepo = require("../repositories/transaction.repo");

const chapterServiceFactory = require("../services/chapter.service");
const chapterControllerFactory = require("../controllers/chapter.controller");

const validateRequest = require("../validators/validateRequest");
const { protect, optionalAuth } = require("../middlewares/auth");

const {
  unlockParam,
  checkUnlockParam,
  chapterDetailsParam,
} = require("../validators/chapter.validators");

const router = express.Router();

const chapterService = chapterServiceFactory({
  sequelize,
  model: models,
  repos: { comicRepo, chapterRepo, chapterImageRepo, chapterUnlockRepo, walletRepo, transactionRepo },
});
const chapterController = chapterControllerFactory(chapterService);

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
 *             message: { type: string, example: "Không đủ vàng để mở khóa chương" }
 *             code: { type: string, example: "INSUFFICIENT_BALANCE" }
 *             status: { type: integer, example: 400 }
 *     ImageItem:
 *       type: object
 *       properties:
 *         imageId: { type: integer, nullable: true }
 *         imageUrl: { type: string, example: "https://res.cloudinary.com/.../page-1.jpg" }
 *         pageNumber: { type: integer, example: 1 }
 *     ChapterDetails:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         comicId: { type: integer }
 *         comicTitle: { type: string }
 *         comicSlug: { type: string }
 *         chapterNumber: { type: number, example: 10.5 }
 *         chapterTitle: { type: string }
 *         images:
 *           type: array
 *           items: { type: string, example: "https://..." }
 *         allChapters:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: integer }
 *               name: { type: string, example: "Chương 10: Tựa đề" }
 *         prevChapterSlug: { type: string, nullable: true }
 *         nextChapterSlug: { type: string, nullable: true }
 *         isLocked: { type: boolean }
 *         cost: { type: integer, nullable: true }
 *     UnlockStatus:
 *       type: object
 *       properties:
 *         isUnlocked: { type: boolean }
 *         chapterId: { type: integer }
 *         message: { type: string }
 *     UnlockResponse:
 *       type: object
 *       properties:
 *         message: { type: string, example: "Mở khóa chương thành công" }
 *     UpdateChapterBody:
 *       type: object
 *       properties:
 *         title: { type: string, example: "Chương đặc biệt" }
 *         chapterNumber: { type: number, example: 12 }
 *         cost: { type: integer, example: 2 }
 *         isLocked: { type: boolean, example: true }
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ImageItem'
 *     AddChapterBody:
 *       type: object
 *       required: [title, chapterNumber]
 *       properties:
 *         title: { type: string, example: "Chương 1" }
 *         chapterNumber: { type: number, example: 1 }
 *         cost: { type: integer, nullable: true, example: 1 }
 *         isLocked: { type: boolean, example: false }
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ImageItem'
 */

/**
 * @openapi
 * /chapters/{chapterId}/unlock:
 *   post:
 *     tags: [Chapters]
 *     summary: Mở khóa chương (yêu cầu đăng nhập & ví đủ vàng)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mở khóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UnlockResponse'
 *       400:
 *         description: Thiếu điều kiện (đã mở khóa / không đủ vàng / validation)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 *       404:
 *         description: Không tìm thấy User/Chapter/Wallet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/:chapterId/unlock", protect, unlockParam, validateRequest, chapterController.unlockChapter);

/**
 * @openapi
 * /chapters/{chapterId}/check-unlock:
 *   get:
 *     tags: [Chapters]
 *     summary: Kiểm tra trạng thái mở khóa chương (đăng nhập tùy chọn)
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Trạng thái mở khóa
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UnlockStatus'
 *       404:
 *         description: Chapter không tồn tại
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.get("/:chapterId/check-unlock", optionalAuth, checkUnlockParam, validateRequest, chapterController.checkChapterUnlockStatus);

/**
 * @openapi
 * /chapters/{slug}/{chapterNumber}:
 *   get:
 *     tags: [Chapters]
 *     summary: Lấy chi tiết chương (bao gồm ảnh, chương trước/sau)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: chapterNumber
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Chi tiết chương
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ChapterDetails'
 *       404:
 *         description: Không tìm thấy truyện hoặc chương
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.get("/:slug/:chapterNumber", optionalAuth, chapterDetailsParam, validateRequest, chapterController.getChapterDetails);


module.exports = router;
