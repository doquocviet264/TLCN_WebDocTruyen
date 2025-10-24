// routes/admin.routes.js
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
const checkinRepo = require("../repositories/checkin.repo");
const readingHistoryRepo = require("../repositories/reading-history.repo");
const commentRepo = require("../repositories/comment.repo");
const comicFollowRepo = require("../repositories/comic-follow.repo");
const reportRepo = require("../repositories/report.repo");
const commentLikeRepo = require("../repositories/comment-like.repo");
const notificationRepo = require("../repositories/notification.repo");
const deliveryRepo = require("../repositories/notification-delivery.repo");


const genreServiceFactory = require("../services/genre.service");
const genreControllerFactory = require("../controllers/genre.controller");
const commentServiceFactory = require("../services/comment.service");
const commentControllerFactory = require("../controllers/comment.controller");

const userServiceFactory = require("../services/user.service");
const userControllerFactory = require("../controllers/user.controller");
const chapterServiceFactory = require("../services/chapter.service");
const chapterControllerFactory = require("../controllers/chapter.controller");

const reportServiceFactory = require("../services/report.service");
const reportControllerFactory = require("../controllers/report.controller");
const notificationServiceFactory = require("../services/notification.service");
const notificationControllerFactory = require("../controllers/notification.controller");
const comicServiceFactory = require("../services/comic.service");
const comicControllerFactory = require("../controllers/comic.controller");
const { protect, isAdmin } = require("../middlewares/auth");
const validateRequest = require("../validators/validateRequest");

const {
  idParam, comicIdParam, chapterIdParam, userIdParam, actionParam, pagingQuery,
  createComicValidator, updateComicValidator,
  updateChapterValidator, addChapterValidator,
  createGenreValidator, updateGenreValidator,
  createAdminNotificationValidator,
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
const userService = userServiceFactory({
  sequelize,
  model: models,
  repos: {
    userRepo, walletRepo, transactionRepo, checkinRepo,
    readingHistoryRepo, commentRepo, comicFollowRepo, comicRepo, chapterRepo
  },
});
const userController = userControllerFactory(userService);
const reportService = reportServiceFactory({
  model: models,
  repos: { reportRepo },
});
const reportController = reportControllerFactory(reportService);
const commentService = commentServiceFactory({
  sequelize,
  model: models,
  repos: { commentRepo, commentLikeRepo, notificationRepo, deliveryRepo, reportRepo },
});
const commentController = commentControllerFactory(commentService);
const genreService = genreServiceFactory({ model: models, genreRepo });
const genreController = genreControllerFactory(genreService);
const notificationService = notificationServiceFactory({ model: models, notificationRepo, deliveryRepo });
const notificationController = notificationControllerFactory(notificationService);
/* Comics */
/**
 * @openapi
 * /admin/comics:
 *   get:
 *     tags: [Comics-Admin]
 *     summary: Danh sách comics cho trang quản trị (phân trang)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 30 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/comics", protect, isAdmin, pagingQuery, validateRequest, comicController.getComicsForAdmin);
/**
 * @openapi
 * /admin/comics:
 *   post:
 *     tags: [Comics-Admin]
 *     summary: Thêm comic mới
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, genres]
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
 *         description: Thêm thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Thiếu dữ liệu hoặc trùng tên truyện
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/comics", protect, isAdmin, createComicValidator, validateRequest, comicController.addComic);
/**
 * @openapi
 * /admin/comics/{id}:
 *   put:
 *     tags: [Comics-Admin]
 *     summary: Cập nhật comic
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
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
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy comic
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.put("/comics/:id", protect, isAdmin, idParam, updateComicValidator, validateRequest, comicController.updateComic);
/**
 * @openapi
 * /admin/comics/{id}:
 *   get:
 *     tags: [Comics-Admin]
 *     summary: Lấy chi tiết comic cho trang quản trị
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy comic
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.get("/comics/:id", protect, isAdmin, idParam, validateRequest, comicController.getComicByIdForAdmin);
/**
 * @openapi
 * /admin/comics/{id}:
 *   delete:
 *     tags: [Comics-Admin]
 *     summary: (Admin) Xóa truyện và toàn bộ dữ liệu liên quan
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 123 }
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *             example: { success: true, message: "Xóa comic thành công" }
 *       404:
 *         description: Không tìm thấy comic
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */

router.delete("/comics/:id", protect,isAdmin, idParam, validateRequest, comicController.deleteComic)
/* Chapters */
/**
 * @openapi
 * /admin/chapters/{id}:
 *   put:
 *     tags: [Chapter-Admin]
 *     summary: Cập nhật chương (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
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
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy chương
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.put("/chapters/:id", protect, isAdmin, chapterIdParam, updateChapterValidator, validateRequest, chapterController.updateChapter);
/**
 * @openapi
 * /admin/comics/{comicId}/chapters:
 *   post:
 *     tags: [Chapter-Admin]
 *     summary: Thêm chương mới vào comic (admin)
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
 *         description: Thêm chương thành công, trả về chapter + images
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Thiếu dữ liệu / Chương đã tồn tại
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/comics/:comicId/chapters", protect, isAdmin, comicIdParam, addChapterValidator, validateRequest, chapterController.addChapter);
/**
 * @openapi
 * /admin/chapters/{id}:
 *   delete:
 *     tags: [Chapters-Admin]
 *     summary: (Admin) Xóa chương và dữ liệu liên quan
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 456 }
 *     responses:
 *       200:
 *         description: Xóa chương thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *             example: { success: true, message: "Xóa chương thành công" }
 *       404:
 *         description: Không tìm thấy chương
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.delete("/chapters/:id", protect, isAdmin, chapterIdParam, validateRequest, chapterController.deleteChapter)
/* Users */
/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Users-Admin]
 *     summary: (Admin) Danh sách người dùng (phân trang)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Danh sách users
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/users", protect, isAdmin, pagingQuery, validateRequest, userController.getAllUsers);
/**
 * @openapi
 * /admin/users/{userId}/promote:
 *   put:
 *     tags: [Users-Admin]
 *     summary: (Admin) Cấp quyền admin cho user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer, example: 7 }
 *     responses:
 *       200:
 *         description: Cấp quyền thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.patch("/users/:userId/promote", protect, isAdmin, userIdParam, validateRequest, userController.promoteToAdmin);

/**
 * @openapi
 * /admin/users/{userId}/{action}:
 *   put:
 *     tags: [Users-Admin]
 *     summary: (Admin) Khóa/Mở khóa tài khoản
 *     description: action = suspend | activate
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer, example: 7 }
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [suspend, activate]
 *     responses:
 *       200:
 *         description: Thao tác thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.patch("/users/:userId/:action", protect, isAdmin, userIdParam, actionParam, validateRequest, userController.toggleUserStatus);

/* Reports */
/**
 * @openapi
 * /admin/reports:
 *   get:
 *     tags: [Reports-Admin]
 *     summary: (Admin) Danh sách báo cáo có phân trang & lọc
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [comment, chapter]
 *           example: comment
 *       - in: query
 *         name: isResolved
 *         schema:
 *           type: boolean
 *           example: false
 *     responses:
 *       200:
 *         description: Danh sách báo cáo
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/ReportItem' }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         limit: { type: integer, example: 20 }
 *                         total: { type: integer, example: 42 }
 *                         totalPages: { type: integer, example: 3 }
 */
router.get("/reports", protect, isAdmin, pagingQuery, validateRequest, reportController.getAllReports);
/**
 * @openapi
 * /admin/reports/{id}/resolve:
 *   put:
 *     tags: [Reports-Admin]
 *     summary: (Admin) Đánh dấu báo cáo là đã giải quyết
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 11 }
 *     responses:
 *       200:
 *         description: Đã đánh dấu là đã giải quyết
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy báo cáo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.patch("/reports/:id/resolve", protect, isAdmin, idParam, validateRequest, reportController.resolveReport);
/**
 * @openapi
 * /admin/reports/{id}:
 *   delete:
 *     tags: [Reports-Admin]
 *     summary: (Admin) Xóa báo cáo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 11 }
 *     responses:
 *       200:
 *         description: Đã xóa báo cáo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy báo cáo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.delete("/reports/:id", protect, isAdmin, idParam, validateRequest, reportController.deleteReport);

/* Comments */
/**
 * @openapi
 * /admin/comments:
 *   get:
 *     tags: [Comments-Admin]
 *     summary: (Admin) Lấy tất cả bình luận có phân trang
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/comments", protect, isAdmin, pagingQuery, validateRequest, commentController.getAllComments);
/**
 * @openapi
 * /admin/comments/{id}:
 *   delete:
 *     tags: [Comments-Admin]
 *     summary: (Admin) Xóa bình luận và thông báo tới người dùng
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Đã xóa bình luận
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy bình luận
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.delete("/comments/:id", protect, isAdmin, idParam, validateRequest, commentController.deleteComment);

/* Genres */
/**
 * @openapi
 * /admin/genres:
 *   get:
 *     tags: [Genres-Admin]
 *     summary: (Admin) Lấy danh sách thể loại có phân trang & tìm kiếm
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "hành" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Danh sách thể loại (có meta)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GenreList'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page: { type: integer, example: 1 }
 *                         totalPages: { type: integer, example: 2 }
 *                         total: { type: integer, example: 14 }
 */
router.get("/genres", protect, isAdmin, pagingQuery, validateRequest, genreController.getAllGenresForAdmin);
/**
 * @openapi
 * /admin/genres:
 *   post:
 *     tags: [Genres-Admin]
 *     summary: (Admin) Tạo thể loại mới
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateGenreBody' }
 *     responses:
 *       200:
 *         description: Thêm thể loại thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       400:
 *         description: Tên trống hoặc trùng
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.post("/genres", protect, isAdmin, createGenreValidator, validateRequest, genreController.createGenre);
/**
 * @openapi
 * /admin/genres/{id}:
 *   put:
 *     tags: [Genres-Admin]
 *     summary: (Admin) Cập nhật tên thể loại
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 3 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateGenreBody' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy thể loại
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.put("/genres/:id", protect, isAdmin, updateGenreValidator, validateRequest, genreController.updateGenre);
/**
 * @openapi
 * /admin/notifications:
 *   get:
 *     tags: [Notifications-Admin]
 *     summary: (Admin) Lấy danh sách thông báo (chỉ loại promotion & system)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *         description: Trang hiện tại
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             example:
 *               rows:
 *                 - notificationId: 1
 *                   title: "Khuyến mãi 10.10"
 *                   message: "Nạp xu nhận thêm 25% trong ngày 10/10."
 *                   category: "promotion"
 *                   createdAt: "2025-10-04T09:10:00.000Z"
 *                 - notificationId: 2
 *                   title: "Bảo trì hệ thống"
 *                   message: "Hệ thống bảo trì lúc 00:00 ngày 12/10."
 *                   category: "system"
 *                   createdAt: "2025-10-02T23:00:00.000Z"
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 52
 *                 totalPages: 3
 */
router.get("/notifications", protect, isAdmin, pagingQuery, validateRequest, notificationController.getAllNotificationsForAdmin);

/**
 * @openapi
 * /admin/notifications:
 *   post:
 *     tags: [Notifications-Admin]
 *     summary: (Admin) Tạo thông báo broadcast (promotion/system)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, title]
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [promotion, system]
 *                 example: promotion
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 example: "Khuyến mãi 10.10"
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Nạp xu hôm nay +25%."
 *     responses:
 *       200:
 *         description: Tạo thông báo thành công
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 notificationId: 123
 *                 category: "promotion"
 *                 audienceType: "global"
 *                 title: "Khuyến mãi 10.10"
 *                 message: "Nạp xu hôm nay +25%."
 *                 createdAt: "2025-10-24T06:30:00.000Z"
 */

router.post("/notifications", protect, isAdmin, createAdminNotificationValidator, notificationController.createAdminNotification);

module.exports = router;
