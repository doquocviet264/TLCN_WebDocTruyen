// app/routes/user.routes.js
const express = require("express");
const multer = require("multer");

const { sequelize, models } = require("../db");
const userRepo = require("../repositories/user.repo");
const walletRepo = require("../repositories/wallet.repo");
const transactionRepo = require("../repositories/transaction.repo");
const checkinRepo = require("../repositories/checkin.repo");
const readingHistoryRepo = require("../repositories/reading-history.repo");
const commentRepo = require("../repositories/comment.repo");
const comicFollowRepo = require("../repositories/comic-follow.repo");
const comicRepo = require("../repositories/comic.repo");
const chapterRepo = require("../repositories/chapter.repo");

const userServiceFactory = require("../services/user.service");
const userControllerFactory = require("../controllers/user.controller");

const validateRequest = require("../validators/validateRequest");
const {
  updateProfileValidator,
  changePasswordValidator,
  adminUsersListValidator,
  toggleStatusValidator,
  promoteValidator,
} = require("../validators/user.validators");
const { protect } = require("../middlewares/auth");

const router = express.Router();

// Multer (chỉ ảnh)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Chỉ được upload ảnh"));
    cb(null, true);
  },
});

const userService = userServiceFactory({
  sequelize,
  model: models,
  repos: {
    userRepo, walletRepo, transactionRepo, checkinRepo,
    readingHistoryRepo, commentRepo, comicFollowRepo, comicRepo, chapterRepo
  },
});
const userController = userControllerFactory(userService);
// middleware xác thực toàn nhóm /user
router.use(protect);
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
 *             message: { type: string, example: "Không tìm thấy người dùng" }
 *             code: { type: string, example: "USER_NOT_FOUND" }
 *             status: { type: integer, example: 404 }
 *     UserProfile:
 *       type: object
 *       properties:
 *         userId: { type: integer, example: 7 }
 *         username: { type: string, example: "vietdo" }
 *         email: { type: string, example: "user@example.com" }
 *         avatar: { type: string, nullable: true, example: "https://..." }
 *         role: { type: string, example: "user" }
 *         status: { type: string, example: "active" }
 *         isVerified: { type: boolean, example: true }
 *         goldCoins: { type: integer, example: 120 }
 *         totalRead: { type: integer, example: 34 }
 *         favorites: { type: integer, example: 12 }
 *         comments: { type: integer, example: 18 }
 *     UpdateProfileBody:
 *       type: object
 *       properties:
 *         username: { type: string, example: "vietdo" }
 *         gender: { type: string, example: "male" }
 *         birthday: { type: string, example: "2000-01-01" }
 *     ChangePasswordBody:
 *       type: object
 *       required: [currentPassword, newPassword]
 *       properties:
 *         currentPassword: { type: string, example: "oldPass123" }
 *         newPassword: { type: string, example: "newPass456" }
 *     GoldTransaction:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1001 }
 *         description: { type: string, example: "Điểm danh hàng ngày - Ngày 2" }
 *         amount: { type: integer, example: 10 }
 *         date: { type: string, example: "21/10/2025" }
 *     GoldDetails:
 *       type: object
 *       properties:
 *         transactionHistory:
 *           type: array
 *           items: { $ref: '#/components/schemas/GoldTransaction' }
 *         dailyCheckin:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day: { type: integer, example: 3 }
 *               checked: { type: boolean, example: true }
 *               isToday: { type: boolean, example: false }
 *     ActivityReadingItem:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 55 }
 *         cover: { type: string, example: "https://..." }
 *         title: { type: string, example: "One Piece" }
 *         lastReadChapter: { type: number, example: 1103 }
 *         lastChapterNumber: { type: number, example: 1105 }
 *         lastRead: { type: string, format: date-time }
 *         status: { type: string, example: "Đang đọc" }
 *     CommentHistoryItem:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 501 }
 *         content: { type: string, example: "Arc này đỉnh!" }
 *         comicTitle: { type: string, example: "JJK" }
 *         context: { type: string, example: "JJK" }
 *         timestamp: { type: string, format: date-time }
 *     UserActivity:
 *       type: object
 *       properties:
 *         readingList:
 *           type: array
 *           items: { $ref: '#/components/schemas/ActivityReadingItem' }
 *         favoriteComics:
 *           type: array
 *           items:
 *             type: object
 *             additionalProperties: true
 *         commentHistory:
 *           type: array
 *           items: { $ref: '#/components/schemas/CommentHistoryItem' }
 */

/**
 * @openapi
 * /user/profile:
 *   get:
 *     tags: [Users]
 *     summary: Lấy thông tin hồ sơ người dùng
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Hồ sơ người dùng
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/UserProfile' }
 */
router.get("/profile", userController.getProfile);

/**
 * @openapi
 * /user/profile:
 *   put:
 *     tags: [Users]
 *     summary: Cập nhật thông tin hồ sơ người dùng
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateProfileBody' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.put("/profile", updateProfileValidator, validateRequest, userController.updateProfile);

/**
 * @openapi
 * /user/password:
 *   put:
 *     tags: [Users]
 *     summary: Đổi mật khẩu
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ChangePasswordBody' }
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.put("/password", changePasswordValidator, validateRequest, userController.changePassword);

/**
 * @openapi
 * /user/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Tải lên avatar (multipart/form-data, max 2MB)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cập nhật avatar thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.post("/avatar", upload.single("avatar"), userController.uploadAvatar);

/**
 * @openapi
 * /user/gold-details:
 *   get:
 *     tags: [Users]
 *     summary: Lịch sử vàng và tiến độ điểm danh
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Thông tin ví và check-in
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/GoldDetails' }
 */
router.get("/gold-details", userController.getGoldDetails);

/**
 * @openapi
 * /user/checkin:
 *   post:
 *     tags: [Users]
 *     summary: Điểm danh hàng ngày (cộng vàng)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Điểm danh thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Đã điểm danh hôm nay
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/checkin", userController.performCheckIn);

/**
 * @openapi
 * /user/activity:
 *   get:
 *     tags: [Users]
 *     summary: Tổng hợp hoạt động gần đây (đọc, yêu thích, bình luận)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dữ liệu hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/UserActivity' }
 */
router.get("/activity", userController.getUserActivity);

/**
 * @openapi
 * /user/comments:
 *   get:
 *     tags: [Users]
 *     summary: Lấy danh sách bình luận của người dùng (phân trang)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 5 }
 *         description: Số bình luận mỗi trang
 *       - in: query
 *         name: offset
 *         schema: { type: integer, example: 0 }
 *         description: Vị trí bắt đầu (phục vụ "Xem thêm")
 *     responses:
 *       200:
 *         description: Danh sách bình luận của người dùng hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data: 
 *                       type: array
 *                       items: { $ref: '#/components/schemas/UserComment' }
 */

router.get("/comments", protect, userController.getMyComments);


module.exports = router;
