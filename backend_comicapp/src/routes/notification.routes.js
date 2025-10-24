// app/routes/notification.routes.js
const express = require("express");
const { models } = require("../db");
const notificationRepo = require("../repositories/notification.repo");
const deliveryRepo = require("../repositories/notification-delivery.repo");
const notificationServiceFactory = require("../services/notification.service");
const notificationControllerFactory = require("../controllers/notification.controller");
const validateRequest = require("../validators/validateRequest");
const { listValidator, markOneValidator } = require("../validators/notification.validators");
const { protect } = require("../middlewares/auth");

const router = express.Router();

const notificationService = notificationServiceFactory({ model: models, notificationRepo,deliveryRepo });
const notificationController = notificationControllerFactory(notificationService);

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
 *             message: { type: string, example: "Không tìm thấy thông báo" }
 *             code: { type: string, example: "NOTIFICATION_NOT_FOUND" }
 *             status: { type: integer, example: 404 }
 *     NotificationItem:
 *       type: object
 *       properties:
 *         notificationId: { type: integer, example: 101 }
 *         userId: { type: integer, example: 7 }
 *         category: { type: string, example: "comment" }
 *         title: { type: string, example: "Bình luận mới" }
 *         message: { type: string, example: "Ai đó đã phản hồi bình luận của bạn" }
 *         isRead: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *     NotificationList:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items: { $ref: '#/components/schemas/NotificationItem' }
 *         meta:
 *           type: object
 *           properties:
 *             page: { type: integer, example: 1 }
 *             limit: { type: integer, example: 20 }
 *             total: { type: integer, example: 35 }
 *             totalPages: { type: integer, example: 2 }
 *             sinceDays: { type: integer, example: 30 }
 */

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Lấy danh sách thông báo của người dùng (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: sinceDays
 *         schema: { type: integer, example: 30 }
 *         description: Số ngày gần nhất (mặc định 30)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 100 }
 *         description: Giới hạn số lượng thông báo mỗi trang
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *         description: Trang cần lấy
 *     responses:
 *       200:
 *         description: Danh sách thông báo
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - $ref: '#/components/schemas/NotificationList'
 */
router.get("/", protect, listValidator, validateRequest, notificationController.getNotifications);

/**
 * @openapi
 * /notifications/{notificationId}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Đánh dấu một thông báo là đã đọc
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: integer, example: 101 }
 *     responses:
 *       200:
 *         description: Đánh dấu đã đọc thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy thông báo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.put("/:notificationId/read", protect, markOneValidator, validateRequest, notificationController.markAsRead);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Đánh dấu tất cả thông báo là đã đọc (yêu cầu đăng nhập)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Đánh dấu tất cả đã đọc thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.put("/read-all", protect, notificationController.markAllAsRead);

module.exports = router;
