// app/routes/comic.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const comicRepo = require("../repositories/comic.repo");
const chapterRepo = require("../repositories/chapter.repo");
const genreRepo = require("../repositories/genre.repo");
const altNameRepo = require("../repositories/alt-name.repo");
const userRepo = require("../repositories/user.repo");

const comicServiceFactory = require("../services/comic.service");
const comicControllerFactory = require("../controllers/comic.controller");

const { protect, optionalAuth, isAdmin } = require("../middlewares/auth");
const validateRequest = require("../validators/validateRequest");
const {
  slugParam, idParam,
  searchValidator,
} = require("../validators/comic.validators");


const router = express.Router();

const comicService = comicServiceFactory({
  sequelize,
  model: models,
  repos: { comicRepo, chapterRepo, genreRepo, altNameRepo, userRepo },
});
const comicController = comicControllerFactory(comicService);

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
 *             message: { type: string, example: "VALIDATION_ERROR" }
 *             code: { type: string, example: "VALIDATION_ERROR" }
 *             status: { type: integer, example: 422 }
 *     ComicSummary:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 101 }
 *         slug: { type: string, example: "one-piece" }
 *         title: { type: string, example: "One Piece" }
 *         image: { type: string, example: "https://..." }
 *         lastChapter: { type: number, nullable: true, example: 1103 }
 *     ComicDetails:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         slug: { type: string }
 *         title: { type: string }
 *         author: { type: string }
 *         image: { type: string }
 *         lastUpdate: { type: string, format: date-time }
 *         status: { type: string, example: "In Progress" }
 *         description: { type: string }
 *         genres:
 *           type: array
 *           items: { type: string }
 *         rating: { type: number, example: 4.7 }
 *         reviewCount: { type: integer, example: 125 }
 *         followers: { type: integer, example: 3400 }
 *         isFollowing: { type: boolean, example: false }
 *         likers: { type: integer, example: 2100 }
 *         isFavorite: { type: boolean, example: false }
 *         chapters:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: integer }
 *               number: { type: number }
 *               title: { type: string }
 *               views: { type: integer }
 *               isLocked: { type: boolean }
 *               time: { type: string, format: date-time }
 *     SearchResult:
 *       type: object
 *       properties:
 *         comics:
 *           type: array
 *           items: { $ref: '#/components/schemas/ComicSummary' }
 *         totalComics: { type: integer, example: 240 }
 *         totalPages: { type: integer, example: 6 }
 *         currentPage: { type: integer, example: 1 }
 */

/**
 * @openapi
 * /comics/search:
 *   get:
 *     tags: [Comics]
 *     summary: Tìm kiếm comics
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Từ khóa tên truyện/tác giả
 *       - in: query
 *         name: genres
 *         schema: { type: string, example: "Action,Adventure" }
 *       - in: query
 *         name: status
 *         schema: { type: string, example: "all" }
 *       - in: query
 *         name: country
 *         schema: { type: string, example: "all" }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [newest, rating, oldest, popular], example: "newest" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, example: 40 }
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/SearchResult' }
 */
router.get("/search", searchValidator, validateRequest, comicController.searchComics);

/**
 * @openapi
 * /comics/homepage-sections:
 *   get:
 *     tags: [Comics]
 *     summary: Dữ liệu trang chủ (ngẫu nhiên, hoàn thành, theo thể loại)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/homepage-sections", comicController.getHomepageSections);

/**
 * @openapi
 * /comics/followed:
 *   get:
 *     tags: [Comics]
 *     summary: Danh sách truyện đang theo dõi của người dùng
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/followed", protect, comicController.getFollowedComics);

/**
 * @openapi
 * /comics/rankings:
 *   get:
 *     tags: [Comics]
 *     summary: Bảng xếp hạng (theo views/follows/new)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/rankings", comicController.getRankings);

/**
 * @openapi
 * /comics/featured:
 *   get:
 *     tags: [Comics]
 *     summary: Truyện nổi bật
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/featured", comicController.getFeaturedComics);

/**
 * @openapi
 * /comics/newly-updated:
 *   get:
 *     tags: [Comics]
 *     summary: Truyện cập nhật mới nhất
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/newly-updated", comicController.getNewlyUpdatedComics);

/**
 * @openapi
 * /comics/{slug}:
 *   get:
 *     tags: [Comics]
 *     summary: Chi tiết truyện theo slug (đăng nhập tùy chọn)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chi tiết truyện
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/ComicDetails' }
 *       404:
 *         description: Không tìm thấy truyện
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.get("/:slug", optionalAuth, slugParam, validateRequest, comicController.getComicDetails);

/**
 * @openapi
 * /comics/{slug}/related:
 *   get:
 *     tags: [Comics]
 *     summary: Gợi ý truyện liên quan theo thể loại chung
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 12 }
 *     responses:
 *       200:
 *         description: Danh sách truyện liên quan
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.get("/:slug/related", slugParam, validateRequest, comicController.getRelatedComics);

/**
 * @openapi
 * /comics/{slug}/follow:
 *   post:
 *     tags: [Comics]
 *     summary: Theo dõi / hủy theo dõi truyện
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trạng thái theo dõi sau thao tác
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.post("/:slug/follow", protect, slugParam, validateRequest, comicController.toggleFollow);

/**
 * @openapi
 * /comics/{slug}/like:
 *   post:
 *     tags: [Comics]
 *     summary: Thích / hủy thích truyện
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trạng thái yêu thích sau thao tác
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 */
router.post("/:slug/like", protect, slugParam, validateRequest, comicController.toggleLike);

/**
 * @openapi
 * /comics/id/{comicId}:
 *   get:
 *     tags: [Comics]
 *     summary: Lấy thông tin tối giản cho lịch sử đọc (theo ID)
 *     parameters:
 *       - in: path
 *         name: comicId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Trả về { slug, title, image }
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OkEnvelope' }
 *       404:
 *         description: Không tìm thấy truyện
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorEnvelope' }
 */
router.get("/id/:comicId", idParam, validateRequest, comicController.getComicDetailForHistory);

module.exports = router;
