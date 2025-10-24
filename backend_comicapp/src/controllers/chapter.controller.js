// app/controllers/chapter.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (chapterService) => ({
  getChapterDetails: asyncHandler(async (req, res) => {
    const { slug, chapterNumber } = req.params;
    const data = await chapterService.getChapterDetails({ slug, chapterNumber });
    return ok(res, { data });
  }),

  checkChapterUnlockStatus: asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.userId : null;
    const { chapterId } = req.params;
    const data = await chapterService.checkChapterUnlockStatus({ userId, chapterId });
    return ok(res, { data });
  }),

  unlockChapter: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { chapterId } = req.params;
    const data = await chapterService.unlockChapter({ userId, chapterId });
    return ok(res, { data });
  }),

  updateChapter: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, chapterNumber, cost, isLocked, images } = req.body;
    const data = await chapterService.updateChapter({ id, title, chapterNumber, cost, isLocked, images });
    return ok(res, { data });
  }),

  addChapter: asyncHandler(async (req, res) => {
    const { comicId } = req.params;
    const { title, chapterNumber, cost, isLocked, images } = req.body;
    const data = await chapterService.addChapter({ comicId, title, chapterNumber, cost, isLocked, images });
    return ok(res, { data });
  }),
  deleteChapter: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await chapterService.deleteChapter({ id: +id });
    return ok(res, {data});
  }),
});
