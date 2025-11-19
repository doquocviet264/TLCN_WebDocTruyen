// app/routes/chat.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const chatRepo = require("../repositories/chat.repo"); // hoặc chat.repository, miễn đúng file
const chatServiceFactory = require("../services/chat.service");
const chatControllerFactory = require("../controllers/chat.controller");

const { protect } = require("../middlewares/auth");

const router = express.Router();

// Khởi tạo service + controller giống chapter
const chatService = chatServiceFactory({
  sequelize,
  model: models,
  repos: { chatRepo },
});
const chatController = chatControllerFactory(chatService);

/**
 * @openapi
 * /chat/channels:
 *   get:
 *     tags: [Chat]
 *     summary: Lấy danh sách kênh chat
 *     security: [{ bearerAuth: [] }]
 */
router.get("/channels", protect, chatController.getChannels);

/**
 * @openapi
 * /chat/channels/{channelId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Lấy tin nhắn của kênh (phân trang)
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  "/channels/:channelId/messages",
  protect,
  chatController.getChannelMessages
);

module.exports = router;
