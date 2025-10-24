// app/controllers/genre.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (genreService) => ({
  // GET /genres
  getAllGenres: asyncHandler(async (req, res) => {
    const data = await genreService.listPublic();
    return ok(res, { data });
  }),

  // GET /genres/admin
  getAllGenresForAdmin: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const search = (req.query.search || "").trim();
    const { rows, meta } = await genreService.listAdmin({ page, limit: 10, search });
    return ok(res, { data: rows, meta });
  }),

  // POST /genres/admin
  createGenre: asyncHandler(async (req, res) => {
    const data = await genreService.create({ name: req.body.name });
    return ok(res, { data });
  }),

  // PUT /genres/admin/:id
  updateGenre: asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const data = await genreService.update({ id, name: req.body.name });
    return ok(res, { data });
  }),
});
