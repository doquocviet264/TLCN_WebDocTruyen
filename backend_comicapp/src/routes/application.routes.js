// app/routes/application.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

// Import Repositories (Dạng Object Literal)
const applicationRepo = require("../repositories/application.repo");
const userRepo = require("../repositories/user.repo");
const groupRepo = require("../repositories/group.repo");
const groupMemberRepo = require("../repositories/groupMember.repo");

// Import Factories
const applicationServiceFactory = require("../services/application.service");
const applicationControllerFactory = require("../controllers/application.controller");

// Middlewares
const validateRequest = require("../validators/validateRequest");
const { protect, isAdmin } = require("../middlewares/auth");
const {belongsToGroup, isGroupLeader } = require("../middlewares/groupAuth");

// Validators
const {
  createBecomeTranslatorValidator,
  createJoinGroupValidator,
  applicationIdValidator,
  groupIdValidator,
  updateStatusValidator,
  listValidator,
} = require("../validators/application.validators");

const router = express.Router();


const applicationService = applicationServiceFactory({
  sequelize,
  model: models,
  applicationRepo,
  userRepo,
  groupRepo,
  groupMemberRepo,
});

const applicationController = applicationControllerFactory(applicationService);

// -------------------------------------------------------
// SWAGGER SCHEMAS
// -------------------------------------------------------

/**
 * @openapi
 * components:
 *   schemas:
 *     ApplicationSummary:
 *       type: object
 *       properties:
 *         applicationId:
 *           type: integer
 *           description: ID của đơn đăng ký
 *         userId:
 *           type: integer
 *           description: ID người tạo đơn
 *         type:
 *           type: string
 *           enum: [BECOME_TRANSLATOR, JOIN_GROUP]
 *           description: Loại đơn
 *         targetId:
 *           type: integer
 *           nullable: true
 *           description: ID của nhóm (nếu là JOIN_GROUP) hoặc null
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Trạng thái đơn
 *         reason:
 *           type: string
 *           nullable: true
 *           description: Lý do/Lời nhắn
 *         createdAt:
 *           type: string
 *           format: date-time
 *         applicant:
 *           type: object
 *           properties:
 *             userId:
 *               type: integer
 *             username:
 *               type: string
 *             avatar:
 *               type: string
 *         targetGroup:
 *           type: object
 *           nullable: true
 *           properties:
 *             groupId:
 *               type: integer
 *             name:
 *               type: string
 *             avatarUrl:
 *               type: string
 *
 *     CreateBecomeTranslatorBody:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           example: "Tôi muốn đóng góp bản dịch chất lượng cho cộng đồng..."
 *           description: Lý do muốn trở thành dịch giả (10-1000 ký tự)
 *
 *     CreateJoinGroupBody:
 *       type: object
 *       required:
 *         - groupId
 *       properties:
 *         groupId:
 *           type: integer
 *           example: 1
 *           description: ID của nhóm muốn gia nhập
 *         reason:
 *           type: string
 *           example: "Tôi hâm mộ các bộ truyện của nhóm..."
 *           description: Lời nhắn gửi đến trưởng nhóm
 *
 *     UpdateApplicationStatusBody:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [approved, rejected]
 *           example: approved
 *           description: Trạng thái duyệt đơn
 */

// -------------------------------------------------------
// ROUTES + SWAGGER PATHS
// -------------------------------------------------------

/**
 * @openapi
 * /applications/become-translator:
 *   post:
 *     tags:
 *       - Applications
 *     summary: Gửi đơn đăng ký làm dịch giả
 *     description: Người dùng thường gửi đơn để được cấp quyền Dịch giả (Translator).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBecomeTranslatorBody'
 *     responses:
 *       '200':
 *         description: Gửi đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ApplicationSummary'
 *       '400':
 *         description: Lỗi validation hoặc đã có đơn chờ duyệt / user đã là dịch giả
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       '404':
 *         description: Không tìm thấy người dùng
 */
router.post(
  "/become-translator",
  protect,
  createBecomeTranslatorValidator,
  validateRequest,
  applicationController.createBecomeTranslatorApplication
);

/**
 * @openapi
 * /applications/join-group:
 *   post:
 *     tags:
 *       - Applications
 *     summary: Gửi đơn xin gia nhập nhóm dịch
 *     description: Chỉ Dịch giả (Translator) mới có thể gửi đơn này.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJoinGroupBody'
 *     responses:
 *       '200':
 *         description: Gửi đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ApplicationSummary'
 *       '400':
 *         description: Đã là thành viên hoặc đã có đơn chờ duyệt
 *       '403':
 *         description: Chỉ dịch giả mới được thực hiện hành động này
 *       '404':
 *         description: Không tìm thấy nhóm
 */
router.post(
  "/join-group",
  protect,
  createJoinGroupValidator,
  validateRequest,
  applicationController.createJoinGroupApplication
);

/**
 * @openapi
 * /applications/mine:
 *   get:
 *     tags:
 *       - Applications
 *     summary: Xem danh sách đơn đăng ký của tôi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ApplicationSummary'
 */
router.get("/mine", protect, applicationController.getUserApplications);

/**
 * @openapi
 * /applications/admin/translators:
 *   get:
 *     tags:
 *       - Admin
 *       - Applications
 *     summary: (Admin) Xem danh sách đơn xin làm dịch giả
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       '200':
 *         description: Danh sách đơn đăng ký
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         rows:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ApplicationSummary'
 *       '403':
 *         description: Không có quyền Admin
 */
router.get(
  "/admin/translators",
  protect,
  isAdmin,
  listValidator,
  validateRequest,
  applicationController.getTranslatorApplications
);

/**
 * @openapi
 * /applications/admin/translators/{applicationId}:
 *   patch:
 *     tags:
 *       - Admin
 *       - Applications
 *     summary: (Admin) Duyệt đơn xin làm dịch giả
 *     description: Admin chấp nhận hoặc từ chối đơn. Nếu chấp nhận, User sẽ lên role "translator".
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateApplicationStatusBody'
 *     responses:
 *       '200':
 *         description: Duyệt đơn thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkEnvelope'
 *       '400':
 *         description: Trạng thái không hợp lệ hoặc đơn đã được xử lý trước đó
 *       '404':
 *         description: Không tìm thấy đơn
 */
router.patch(
  "/admin/translators/:applicationId",
  protect,
  isAdmin,
  applicationIdValidator,
  updateStatusValidator,
  validateRequest,
  applicationController.reviewTranslatorApplication
);

/**
 * @openapi
 * /applications/groups/{groupId}/applications:
 *   get:
 *     tags:
 *       - Groups
 *       - Applications
 *     summary: (Trưởng nhóm) Xem danh sách đơn xin vào nhóm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       '200':
 *         description: Danh sách đơn xin vào nhóm
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         rows:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ApplicationSummary'
 *       '403':
 *         description: Không phải trưởng nhóm
 *       '404':
 *         description: Không tìm thấy nhóm
 */
router.get(
  "/groups/:groupId/applications",
  protect,
  belongsToGroup,
  isGroupLeader,
  groupIdValidator,
  listValidator,
  validateRequest,
  applicationController.getGroupJoinApplications
);

/**
 * @openapi
 * /applications/groups/{groupId}/applications/{applicationId}:
 *   patch:
 *     tags:
 *       - Groups
 *       - Applications
 *     summary: (Trưởng nhóm) Duyệt đơn xin vào nhóm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateApplicationStatusBody'
 *     responses:
 *       '200':
 *         description: Duyệt đơn thành công. Nếu approved, user sẽ thành member.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OkEnvelope'
 *       '400':
 *         description: Lỗi validation hoặc đơn đã xử lý
 *       '403':
 *         description: Không phải trưởng nhóm
 *       '404':
 *         description: Không tìm thấy đơn
 */
router.patch(
  "/groups/:groupId/applications/:applicationId",
  protect,
  belongsToGroup,
  isGroupLeader,
  groupIdValidator.concat(applicationIdValidator),
  updateStatusValidator,
  validateRequest,
  applicationController.reviewGroupJoinApplication
);

module.exports = router;
