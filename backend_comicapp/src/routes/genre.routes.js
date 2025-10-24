// app/routes/genre.routes.js
const express = require("express");
const { models } = require("../db");
const genreRepo = require("../repositories/genre.repo");
const genreServiceFactory = require("../services/genre.service");
const genreControllerFactory = require("../controllers/genre.controller");
const validateRequest = require("../validators/validateRequest");

const router = express.Router();

const genreService = genreServiceFactory({ model: models, genreRepo });
const genreController = genreControllerFactory(genreService);

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
 *             message: { type: string, example: "Tên thể loại đã tồn tại" }
 *             code: { type: string, example: "GENRE_EXISTS" }
 *             status: { type: integer, example: 400 }
 *     GenreItem:
 *       type: object
 *       properties:
 *         genreId: { type: integer, example: 5 }
 *         name: { type: string, example: "Hành động" }
 *     GenreList:
 *       type: array
 *       items: { $ref: '#/components/schemas/GenreItem' }
 *     CreateGenreBody:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "Phiêu lưu" }
 *     UpdateGenreBody:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: "Hài hước" }
 */

/**
 * @openapi
 * /genres:
 *   get:
 *     tags: [Genres]
 *     summary: Lấy danh sách thể loại (public)
 *     responses:
 *       200:
 *         description: Danh sách thể loại truyện
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/OkEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GenreList'
 */
router.get("/", genreController.getAllGenres);


module.exports = router;
