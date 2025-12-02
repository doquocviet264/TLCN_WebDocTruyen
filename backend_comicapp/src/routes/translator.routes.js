const express = require("express");
const router = express.Router();
const { sequelize, models } = require("../db");

const comicRepo = require("../repositories/comic.repo");
const chapterRepo = require("../repositories/chapter.repo");
const genreRepo = require("../repositories/genre.repo");
const altNameRepo = require("../repositories/alt-name.repo");
const userRepo = require("../repositories/user.repo");
const chapterImageRepo = require("../repositories/chapterImage.repo");
const chapterUnlockRepo = require("../repositories/chapterUnlock.repo");
const walletRepo = require("../repositories/wallet.repo");
const transactionRepo = require("../repositories/transaction.repo");

const comicServiceFactory = require("../services/comic.service");
const comicControllerFactory = require("../controllers/comic.controller");
const chapterServiceFactory = require("../services/chapter.service");
const chapterControllerFactory = require("../controllers/chapter.controller");

const { protect } = require("../middlewares/auth");
const { belongsToGroup, isGroupLeader, setGroupIdFromComic, setGroupIdFromChapter } = require("../middlewares/groupAuth");
const validateRequest = require("../validators/validateRequest");

const {
  idParam, comicIdParam, chapterIdParam, pagingQuery,
  createComicValidator, updateComicValidator,
  updateChapterValidator, addChapterValidator,
} = require("../validators/admin.validators");

const chapterService = chapterServiceFactory({
  sequelize,
  model: models,
  repos: { comicRepo, chapterRepo, chapterImageRepo, chapterUnlockRepo, walletRepo, transactionRepo },
});
const chapterController = chapterControllerFactory(chapterService);
const comicService = comicServiceFactory({
  sequelize,
  model: models,
  repos: { comicRepo, chapterRepo, genreRepo, altNameRepo, userRepo },
});
const comicController = comicControllerFactory(comicService);

/* Comics for Translator Group Leader */
/**
 * @openapi
 * /translator/{groupId}/comics:
 *   get:
 *     tags:
 *       - Translator-Comics
 *     summary: Danh sách truyện của nhóm dịch (cho leader)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID của nhóm dịch
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 30
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/:groupId/comics", protect, belongsToGroup, pagingQuery, validateRequest, comicController.getComicsForTranslatorGroup);

/**
 * @openapi
 * /translator/{groupId}/comics:
 *   post:
 *     tags:
 *       - Translator-Comics
 *     summary: Thêm comic mới vào nhóm (chỉ leader)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID của nhóm dịch
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - genres
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               status:
 *                 type: string
 *                 example: "In Progress"
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 description: "URL hoặc base64 data:"
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *               aliases:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Thêm thành công
 *       400:
 *         description: Thiếu dữ liệu hoặc trùng tên truyện
 */

router.post("/:groupId/comics", protect, belongsToGroup, isGroupLeader, createComicValidator, validateRequest, comicController.addComicToGroup);

/**
 * @openapi
 * /translator/comics/{comicId}:
 *   put:
 *     tags: [Translator-Comics]
 *     summary: Cập nhật comic trong nhóm (chỉ leader)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               status: { type: string, example: "In Progress" }
 *               description: { type: string }
 *               image: { type: string, description: "URL hoặc base64 data:" }
 *               genres:
 *                 type: array
 *                 items: { type: string }
 *               aliases:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy comic
 */
router.put("/comics/:comicId", protect, setGroupIdFromComic, belongsToGroup, isGroupLeader, comicIdParam, updateComicValidator, validateRequest, comicController.updateComicInGroup);

/**
 * @openapi
 * /translator/comics/{comicId}:
 *   delete:
 *     tags: [Translator-Comics]
 *     summary: Xóa truyện khỏi nhóm (chỉ leader)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy comic
 */
router.delete("/comics/:comicId", protect, setGroupIdFromComic, belongsToGroup, isGroupLeader, comicIdParam, validateRequest, comicController.deleteComicFromGroup);

/* Chapters for Translator Group Members (including Leader) */
/**
 * @openapi
 * /translator/comics/{comicId}/chapters:
 *   get:
 *     tags: [Translator-Chapters]
 *     summary: Danh sách chương của một truyện trong nhóm (cho member và leader)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 30 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/comics/:comicId/chapters", protect, setGroupIdFromComic, belongsToGroup, comicIdParam, pagingQuery, validateRequest, chapterController.getChaptersForTranslatorGroup);

/**
 * @openapi
 * /translator/comics/{comicId}/chapters:
 *   post:
 *     tags: [Translator-Chapters]
 *     summary: Thêm chương mới vào truyện (cho member và leader)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddChapterBody' }
 *     responses:
 *       200:
 *         description: Thêm chương thành công
 *       400:
 *         description: Thiếu dữ liệu / Chương đã tồn tại
 */
router.post("/comics/:comicId/chapters", protect, setGroupIdFromComic, belongsToGroup, comicIdParam, addChapterValidator, validateRequest, chapterController.addChapterToGroup);

/**
 * @openapi
 * /translator/chapters/{chapterId}:
 *   put:
 *     tags: [Translator-Chapters]
 *     summary: Cập nhật chương (cho member và leader)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateChapterBody' }
 *     responses:
 *       200:
 *         description: Cập nhật chương thành công
 *       404:
 *         description: Không tìm thấy chương
 */
router.put("/chapters/:chapterId", protect, setGroupIdFromChapter, belongsToGroup, chapterIdParam, updateChapterValidator, validateRequest, chapterController.updateChapterInGroup);

/**
 * @openapi
 * /translator/chapters/{chapterId}:
 *   delete:
 *     tags: [Translator-Chapters]
 *     summary: Xóa chương (cho member và leader)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: chapterId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Xóa chương thành công
 *       404:
 *         description: Không tìm thấy chương
 */
router.delete("/chapters/:chapterId", protect, setGroupIdFromChapter, belongsToGroup, chapterIdParam, validateRequest, chapterController.deleteChapterInGroup);

module.exports = router;
