// app/controllers/history.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (historyService) => ({
  updateReadingHistory: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { comicId, chapterId } = req.body;
    const data = await historyService.updateReadingHistory({ userId, comicId, chapterId });
    return ok(res, { data });
  }),

  getReadingHistory: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = await historyService.getReadingHistory({ userId, limit });
    return ok(res, { data });
  }),
  getReadingHistoryByComic: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { comicId } = req.params;
    const data = await historyService.getReadingHistoryByComic({
      userId,
      comicId,
    });
    return ok(res, { data });
  }),

  clearReadingHistory: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const data = await historyService.clearReadingHistory({ userId });
    return ok(res, { data });
  }),

  deleteReadingHistoryByComic: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { comicId } = req.params;
    const data = await historyService.deleteReadingHistoryByComic({ userId, comicId });
    return ok(res, { data });
  }),
});
