// app/routes/report.routes.js
const express = require("express");
const { models } = require("../db");

const reportRepo = require("../repositories/report.repo");
const reportServiceFactory = require("../services/report.service");
const reportControllerFactory = require("../controllers/report.controller");

const validateRequest = require("../validators/validateRequest");
const { createReportValidator} = require("../validators/report.validators");
const { protect} = require("../middlewares/auth");

const router = express.Router();

const reportService = reportServiceFactory({
  model: models,
  repos: { reportRepo },
});
const reportController = reportControllerFactory(reportService);

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
 *             message: { type: string, example: "Không tìm thấy báo cáo" }
 *             code: { type: string, example: "REPORT_NOT_FOUND" }
 *             status: { type: integer, example: 404 }
 *     CreateReportBody:
 *       type: object
 *       required: [title, description, type, targetId]
 *       properties:
 *         title: { type: string, example: "Nội dung vi phạm" }
 *         description: { type: string, example: "Bình luận chứa ngôn ngữ xúc phạm" }
 *         type:
 *           type: string
 *           enum: [comment, chapter]
 *           example: comment
 *         targetId:
 *           type: integer
 *           example: 123
 *     ReportUserInfo:
 *       type: object
 *       properties:
 *         userId: { type: integer, example: 7 }
 *         username: { type: string, example: "vietdo" }
 *         email: { type: string, example: "user@example.com" }
 *         avatar: { type: string, nullable: true, example: "https://..." }
 *     ReportItem:
 *       type: object
 *       properties:
 *         reportId: { type: integer, example: 11 }
 *         userId: { type: integer, example: 7 }
 *         title: { type: string }
 *         description: { type: string }
 *         type: { type: string, enum: [comment, chapter] }
 *         targetId: { type: integer }
 *         isResolved: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         resolvedAt: { type: string, format: date-time, nullable: true }
 *         user: { $ref: '#/components/schemas/ReportUserInfo' }
 *         target:
 *           oneOf:
 *             - type: object
 *               properties:
 *                 content: { type: string, example: "comment text..." }
 *                 createdAt: { type: string, format: date-time }
 *                 User:
 *                   type: object
 *                   properties:
 *                     username: { type: string, example: "john" }
 *             - type: object
 *               properties:
 *                 title: { type: string, example: "Chapter 10" }
 *                 chapterNumber: { type: number, example: 10 }
 *                 Comic:
 *                   type: object
 *                   properties:
 *                     title: { type: string, example: "One Piece" }
 */


/**
 * @openapi
 * /reports:
 *   post:
 *     tags: [Reports]
 *     summary: Tạo báo cáo (user)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReportBody' }
 *     responses:
 *       200:
 *         description: Tạo báo cáo thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Thiếu dữ liệu / type không hợp lệ / target không tồn tại
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/", protect, createReportValidator, validateRequest, reportController.createReport);


module.exports = router;
