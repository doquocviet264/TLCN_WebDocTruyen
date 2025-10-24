// app/routes/quest.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const questRepo = require("../repositories/quest.repo");
const userQuestRepo = require("../repositories/user-quest.repo");
const walletRepo = require("../repositories/wallet.repo");
const transactionRepo = require("../repositories/transaction.repo");

const questServiceFactory = require("../services/quest.service");
const questControllerFactory = require("../controllers/quest.controller");

const validateRequest = require("../validators/validateRequest");
const { claimValidator, progressValidator } = require("../validators/quest.validators");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// Bảo vệ toàn bộ nhóm quests
router.use(protect);

const questService = questServiceFactory({
  sequelize,
  model: models,
  repos: { questRepo, userQuestRepo, walletRepo, transactionRepo },
});
const questController = questControllerFactory(questService);

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
 *             message: { type: string, example: "Không tìm thấy nhiệm vụ" }
 *             code: { type: string, example: "QUEST_NOT_FOUND" }
 *             status: { type: integer, example: 404 }
 *     DailyQuestItem:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 12 }
 *         title: { type: string, example: "Đọc 3 chương" }
 *         reward: { type: integer, example: 5, description: "Số vàng" }
 *         progress: { type: integer, example: 1 }
 *         target: { type: integer, example: 3 }
 *         claimed: { type: boolean, example: false }
 *         category: { type: string, example: "reading" }
 *     QuestProgressBody:
 *       type: object
 *       required: [category]
 *       properties:
 *         category: { type: string, example: "reading" }
 *         amount: { type: integer, example: 1, description: "Mặc định 1" }
 */

/**
 * @openapi
 * /quests/daily:
 *   get:
 *     tags: [Quests]
 *     summary: Lấy danh sách nhiệm vụ hằng ngày (tự tạo nếu chưa phát trong ngày)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Danh sách quest của ngày hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/DailyQuestItem' }
 */
router.get("/daily", questController.getDailyQuests);

/**
 * @openapi
 * /quests/{userQuestId}/claim:
 *   post:
 *     tags: [Quests]
 *     summary: Nhận thưởng nhiệm vụ đã hoàn thành
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userQuestId
 *         required: true
 *         schema: { type: integer, example: 12 }
 *     responses:
 *       200:
 *         description: Nhận thưởng thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Chưa hoàn thành / đã nhận rồi
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 *       404:
 *         description: Không tìm thấy nhiệm vụ / ví
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/:userQuestId/claim", claimValidator, validateRequest, questController.claimQuestReward);

/**
 * @openapi
 * /quests/progress:
 *   put:
 *     tags: [Quests]
 *     summary: Cập nhật tiến độ nhiệm vụ theo category (dùng cho test/manual)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/QuestProgressBody' }
 *     responses:
 *       200:
 *         description: Cập nhật tiến độ thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy nhiệm vụ phù hợp
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.put("/progress", progressValidator, validateRequest, questController.updateQuestProgress);

module.exports = router;
