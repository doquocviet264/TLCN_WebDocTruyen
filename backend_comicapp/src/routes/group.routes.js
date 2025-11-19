// app/routes/group.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const groupRepo = require("../repositories/group.repo");
const groupMemberRepo = require("../repositories/groupMember.repo");
const comicRepo = require("../repositories/comic.repo");
const groupServiceFactory = require("../services/group.service");
const groupControllerFactory = require("../controllers/group.controller");

const validateRequest = require("../validators/validateRequest");
const { protect } = require("../middlewares/auth");

const {
  groupIdParam,
  memberUserIdParam,
  createGroupBody,
  updateGroupBody,
  addMemberBody,
  setLeaderBody,
} = require("../validators/group.validators");

const { param, query } = require('express-validator'); // Import param and query
const asyncHandler = require('../middlewares/asyncHandler'); // Import asyncHandler

const router = express.Router();

const groupService = groupServiceFactory({
  sequelize,
  model: models,
  repos: { groupRepo, groupMemberRepo, comicRepo },
});

const groupController = groupControllerFactory(groupService);

/**
 * @openapi
 * components:
 *   schemas:
 *     GroupMember:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *         username:
 *           type: string
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *         role:
 *           type: string
 *           enum: [leader, member]
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         totalComics:
 *           type: integer
 *           nullable: true
 *     GroupComic:
 *       type: object
 *       properties:
 *         comicId: { type: integer }
 *         title: { type: string }
 *         slug: { type: string }
 *         coverUrl:
 *           type: string
 *           nullable: true
 *         views: { type: integer }
 *         chaptersCount: { type: integer }
 *         isCompleted: { type: boolean }
 *     GroupStats:
 *       type: object
 *       properties:
 *         totalComics: { type: integer }
 *         totalViews: { type: integer }
 *         totalMembers: { type: integer }
 *     GroupSummary:
 *       type: object
 *       properties:
 *         groupId: { type: integer }
 *         name: { type: string }
 *         description: { type: string }
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *         ownerId: { type: integer }
 *         createdAt:
 *           type: string
 *           format: date-time
 *         stats:
 *           $ref: '#/components/schemas/GroupStats'
 *     GroupDetails:
 *       allOf:
 *         - $ref: '#/components/schemas/GroupSummary'
 *         - type: object
 *           properties:
 *             members:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupMember'
 *             comics:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GroupComic'
 *     CreateGroupBody:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           example: "Night Owl Translations"
 *         description:
 *           type: string
 *           example: "Nhóm chuyên dịch fantasy, isekai..."
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *     UpdateGroupBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *     AddMemberBody:
 *       type: object
 *       required: [userId]
 *       properties:
 *         userId:
 *           type: integer
 *           example: 123
 *     SetLeaderBody:
 *       type: object
 *       required: [newLeaderId]
 *       properties:
 *         newLeaderId:
 *           type: integer
 *           example: 123
 */

/**
 * @openapi
 * /groups:
 *   post:
 *     tags: [Groups]
 *     summary: Tạo nhóm dịch mới (owner = user hiện tại, auto leader)
 *     description: |
 *       Yêu cầu user có quyền phù hợp (ví dụ role TRANSLATOR/ADMIN).
 *       Sau khi tạo nhóm, user hiện tại sẽ được thêm vào nhóm với vai trò leader.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroupBody'
 *     responses:
 *       200:
 *         description: Tạo nhóm thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GroupSummary'
 *       400:
 *         description: Lỗi validation hoặc user đã là leader của nhóm khác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post(
  "/",
  protect,
  createGroupBody,
  validateRequest,
  groupController.createGroup
);

/**
 * @openapi
 * /groups:
 *   get:
 *     tags: [Groups]
 *     summary: Lấy danh sách nhóm dịch
 *     description: Trả về danh sách nhóm với các thống kê cơ bản (tổng truyện, view, thành viên).
 *     responses:
 *       200:
 *         description: Danh sách nhóm dịch
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
 *                         $ref: '#/components/schemas/GroupSummary'
 */
router.get("/", groupController.listGroups);

/**
 * @openapi
 * /groups/{groupId}:
 *   get:
 *     tags: [Groups]
 *     summary: Lấy chi tiết một nhóm dịch
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chi tiết nhóm dịch (thông tin, members, comics)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GroupDetails'
 *       404:
 *         description: Không tìm thấy nhóm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.get(
  "/:groupId",
  groupIdParam,
  validateRequest,
  groupController.getGroupDetails
);

/**
 * @openapi
 * /groups/{groupId}:
 *   patch:
 *     tags: [Groups]
 *     summary: Cập nhật thông tin nhóm dịch
 *     description: Chỉ owner hoặc leader mới có quyền cập nhật nhóm.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGroupBody'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
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
 *                         message:
 *                           type: string
 *                           example: "Cập nhật nhóm thành công"
 *       403:
 *         description: Không có quyền cập nhật nhóm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       404:
 *         description: Không tìm thấy nhóm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.patch(
  "/:groupId",
  protect,
  groupIdParam,
  updateGroupBody,
  validateRequest,
  groupController.updateGroup
);

/**
 * @openapi
 * /groups/{groupId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Xóa nhóm dịch
 *     description: Chỉ owner mới được xóa nhóm. Xóa luôn membership liên quan.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa nhóm thành công
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
 *                         message:
 *                           type: string
 *                           example: "Xóa nhóm thành công"
 *       403:
 *         description: Không có quyền xóa nhóm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       404:
 *         description: Không tìm thấy nhóm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.delete(
  "/:groupId",
  protect,
  groupIdParam,
  validateRequest,
  groupController.deleteGroup
);

/**
 * @openapi
 * /groups/{groupId}/members:
 *   post:
 *     tags: [Groups]
 *     summary: Thêm thành viên vào nhóm
 *     description: Chỉ leader của nhóm (hoặc admin nếu bạn cài) mới được thêm thành viên.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMemberBody'
 *     responses:
 *       200:
 *         description: Thêm thành viên thành công
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
 *                         message:
 *                           type: string
 *                           example: "Thêm thành viên thành công"
 *       400:
 *         description: User đã là member hoặc nhóm đã đủ 5 người
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       403:
 *         description: Không có quyền thêm thành viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       404:
 *         description: Không tìm thấy nhóm hoặc user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post(
  "/:groupId/members",
  protect,
  groupIdParam,
  addMemberBody,
  validateRequest,
  groupController.addMember
);

/**
 * @openapi
 * /groups/{groupId}/members/{userId}:
 *   delete:
 *     tags: [Groups]
 *     summary: Xóa/kick một thành viên khỏi nhóm
 *     description: Chỉ leader mới được xóa member. Không áp dụng cho leader (phải chuyển leader trước).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành viên thành công
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
 *                         message:
 *                           type: string
 *                           example: "Xóa thành viên thành công"
 *       400:
 *         description: User không phải member hoặc là leader
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       403:
 *         description: Không có quyền xóa thành viên
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       404:
 *         description: Không tìm thấy nhóm hoặc user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.delete(
  "/:groupId/members/:userId",
  protect,
  groupIdParam.concat(memberUserIdParam),
  validateRequest,
  groupController.removeMember
);

/**
 * @openapi
 * /groups/{groupId}/leave:
 *   post:
 *     tags: [Groups]
 *     summary: Thành viên rời nhóm
 *     description: |
 *       Thành viên tự rời nhóm. Nếu là leader và nhóm còn nhiều hơn 1 thành viên
 *       thì không được rời, phải chuyển leader trước.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rời nhóm thành công
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
 *                         message:
 *                           type: string
 *                           example: "Rời nhóm thành công"
 *       400:
 *         description: Không phải thành viên nhóm hoặc là leader và còn thành viên khác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post(
  "/:groupId/leave",
  protect,
  groupIdParam,
  validateRequest,
  groupController.leaveGroup
);

/**
 * @openapi
 * /groups/{groupId}/leader:
 *   post:
 *     tags: [Groups]
 *     summary: Chuyển hoặc set leader mới cho nhóm
 *     description: |
 *       Chỉ owner hoặc leader hiện tại mới có quyền đổi leader.
 *       User mới phải là thành viên của nhóm và không được là leader của nhóm khác.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetLeaderBody'
 *     responses:
 *       200:
 *         description: Cập nhật leader thành công
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
 *                         message:
 *                           type: string
 *                           example: "Cập nhật leader thành công"
 *       400:
 *         description: User không phải member hoặc đã là leader group khác
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       403:
 *         description: Không có quyền chuyển leader
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       404:
 *         description: Không tìm thấy nhóm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post(
  "/:groupId/leader",
  protect,
  groupIdParam,
  setLeaderBody,
  validateRequest,
  groupController.setLeader
);
/**
 * @openapi
 * /groups/{groupId}/dashboard:
 *   get:
 *     tags: [Groups]
 *     summary: Thống kê tổng quan nhóm dịch (dashboard)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: range
 *         required: false
 *         schema:
 *           type: string
 *           example: "30d"
 *           description: "Khoảng thời gian phân tích (vd: 7d, 30d)"
 *     responses:
 *       200:
 *         description: Dashboard nhóm dịch
 */
router.get(
  "/:groupId/dashboard",
  protect,
  [
    param("groupId").isInt({ min: 1 }),
    query("range").optional().isString(),
  ],
  validateRequest,
  asyncHandler(groupController.getGroupDashboard)
);
module.exports = router;
