const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (comicService) => ({
  getComicDetails: asyncHandler(async (req, res) => {
    const data = await comicService.getComicDetails({ slug: req.params.slug, userId: req.user?.userId || null });
    return ok(res, { data });
  }),

  toggleFollow: asyncHandler(async (req, res) => {
    const data = await comicService.toggleFollow({ slug: req.params.slug, userId: req.user.userId });
    return ok(res, { data });
  }),

  toggleLike: asyncHandler(async (req, res) => {
    const data = await comicService.toggleLike({ slug: req.params.slug, userId: req.user.userId });
    return ok(res, { data });
  }),

  getNewlyUpdatedComics: asyncHandler(async (_req, res) => {
    const data = await comicService.getNewlyUpdatedComics();
    return ok(res, { data });
  }),

  getFeaturedComics: asyncHandler(async (_req, res) => {
    const data = await comicService.getFeaturedComics();
    return ok(res, { data });
  }),

  getRankings: asyncHandler(async (_req, res) => {
    const data = await comicService.getRankings();
    return ok(res, { data });
  }),

  getHomepageSections: asyncHandler(async (_req, res) => {
    const data = await comicService.getHomepageSections();
    return ok(res, { data });
  }),

  getComicDetailForHistory: asyncHandler(async (req, res) => {
    const data = await comicService.getComicDetailForHistory({ comicId: req.params.comicId });
    return ok(res, { data });
  }),

  searchComics: asyncHandler(async (req, res) => {
    const data = await comicService.searchComics(req.query);
    return ok(res, { data });
  }),

  getFollowedComics: asyncHandler(async (req, res) => {
    const data = await comicService.getFollowedComics({ userId: req.user.userId });
    return ok(res, { data });
  }),

  getRelatedComics: asyncHandler(async (req, res) => {
    const data = await comicService.getRelatedComics({ slug: req.params.slug, limit: parseInt(req.query.limit) || 12 });
    return ok(res, { data });
  }),

  // Admin
  getComicsForAdmin: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const { comics, meta } = await comicService.getComicsForAdmin({ page, limit });
    return ok(res, { data: comics, meta });
  }),

  getComicByIdForAdmin: asyncHandler(async (req, res) => {
    const data = await comicService.getComicByIdForAdmin({ id: req.params.id });
    return ok(res, { data });
  }),

  updateComic: asyncHandler(async (req, res) => {
    const data = await comicService.updateComic({ id: req.params.id, payload: req.body });
    return ok(res, { data });
  }),

  addComic: asyncHandler(async (req, res) => {
    const data = await comicService.addComic({ body: req.body });
    return ok(res, { data });
  }),
  deleteComic: asyncHandler(async (req, res) => {
    const data = await comicService.deleteComic({ id: req.params.id });
    return ok(res, {data});
  }),
});
