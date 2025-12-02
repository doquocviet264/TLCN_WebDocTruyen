// app/routes/chat.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const chatServiceFactory = require("../services/chat.service");
const chatControllerFactory = require("../controllers/chat.controller");

const { protect, optionalAuth } = require("../middlewares/auth");

const router = express.Router();

// Khởi tạo service + controller
const chatService = chatServiceFactory({
  sequelize,
  model: models,
});
const chatController = chatControllerFactory(chatService);

/**
 * @openapi
 * /chat/channels:
 *   get:
 *     tags: [Chat]
 *     summary: Lấy danh sách kênh chat
 *     description: 
 *       - Guest (không đăng nhập): chỉ thấy kênh global.
 *       - User đăng nhập: thấy kênh global + các room đã tham gia.
 */
router.get("/channels", optionalAuth, chatController.getChannels);

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

router.post(
  "/messages/:messageId/pin",
  protect,
  chatController.pinMessage
);

router.post(
  "/messages/:messageId/unpin",
  protect,
  chatController.unpinMessage
);
// POST /chat/channels/:channelId/join
router.post(
  "/channels/:channelId/join",
  protect,
  chatController.joinChannel
);
router.get('/rooms', optionalAuth, chatController.listRooms);
module.exports = router;
