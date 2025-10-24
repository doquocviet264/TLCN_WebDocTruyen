// app/controllers/comment.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (commentService) => ({
  getCommentsByComic: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const userId = req.user ? req.user.userId : null;

    const { comments, meta } = await commentService.getCommentsByComic({
      slug, page, limit: 10, userId,
    });
    return ok(res, { data: comments, meta });
  }),
  getCommentsByChapter: asyncHandler(async (req, res) => {
    const { chapterId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const userId = req.user ? req.user.userId : null;

    const { comments, meta } = await commentService.getCommentsByChapter({
      chapterId: parseInt(chapterId, 10), // Dùng chapterId
      page,
      limit: 10,
      userId,
    });
    return ok(res, { data: comments, meta });
  }),
  createComment: asyncHandler(async (req, res) => {
    const { comicId, content, parentId, chapterId } = req.body;
    const userId = req.user.userId;
    const data = await commentService.createComment({ comicId, content, parentId, userId, chapterId });
    return ok(res, { data });
  }),

  toggleLikeComment: asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.userId;
    const data = await commentService.toggleLikeComment({ commentId, userId });
    return ok(res, { data });
  }),

  getRecentComments: asyncHandler(async (req, res) => {
    const data = await commentService.getRecentComments();
    return ok(res, { data });
  }),

  getAllComments: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await commentService.getAllCommentsAdmin({ page, limit: 20 });
    return ok(res, { data: data.comments, meta: data.meta });
  }),

  deleteComment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await commentService.deleteComment({ id });
    return ok(res, { data });
  }),
});
