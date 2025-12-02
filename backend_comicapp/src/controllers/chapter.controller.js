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

  // Translator Group Member/Leader
  getChaptersForTranslatorGroup: asyncHandler(async (req, res) => {
    const { comicId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const { chapters, meta } = await chapterService.getChaptersForTranslatorGroup({ comicId: +comicId, page, limit });
    return ok(res, { data: chapters, meta });
  }),

  addChapterToGroup: asyncHandler(async (req, res) => {
    const { comicId } = req.params;
    const { title, chapterNumber, cost, isLocked, images } = req.body;
    const groupId = req.params.groupId; // Set by setGroupIdFromComic middleware
    const data = await chapterService.addChapterToGroup({ comicId: +comicId, groupId, title, chapterNumber, cost, isLocked, images });
    return ok(res, { data });
  }),

  updateChapterInGroup: asyncHandler(async (req, res) => {
    const { chapterId } = req.params;
    const { title, chapterNumber, cost, isLocked, images } = req.body;
    const groupId = req.params.groupId; // Set by setGroupIdFromChapter middleware
    const data = await chapterService.updateChapterInGroup({ chapterId: +chapterId, groupId, title, chapterNumber, cost, isLocked, images });
    return ok(res, { data });
  }),

  deleteChapterInGroup: asyncHandler(async (req, res) => {
    const { chapterId } = req.params;
    const groupId = req.params.groupId; // Set by setGroupIdFromChapter middleware
    const data = await chapterService.deleteChapterInGroup({ chapterId: +chapterId, groupId });
    return ok(res, {data});
  }),
});
