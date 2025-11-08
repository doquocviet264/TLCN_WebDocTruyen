const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");
const cloudinary = require("../config/cloudinary"); // Import cloudinary
const fs = require("fs"); // Import fs for file system operations

module.exports = (communityService) => ({
  createPost: asyncHandler(async (req, res) => {
    const files = req.files || [];
    const uploadedImages = [];

    for (const [index, file] of files.entries()) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "community_posts",
      });
      uploadedImages.push({
        imageUrl: result.secure_url,
        imageNumber: index,
      });
      fs.unlinkSync(file.path); // xoá file tạm sau khi upload
    }
    const userId = req.user.userId || req.user.id;
    const data = await communityService.createPost(userId, { ...req.body, images: uploadedImages });
    return ok(res, { data });
  }),

  listPosts: asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.userId || req.user.id : null;
    const { rows, meta } = await communityService.listPosts(req.query, userId);
    return ok(res, { data: rows, meta });
  }),

  getPostById: asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.userId || req.user.id : null;
    const data = await communityService.getPostById(req.params.postId, userId);
    return ok(res, { data });
  }),

  likePost: asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const data = await communityService.likePost(userId, req.params.postId);
    return ok(res, { data });
  }),

  unlikePost: asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const data = await communityService.unlikePost(userId, req.params.postId);
    return ok(res, { data });
  }),

  createComment: asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const data = await communityService.createComment(userId, req.params.postId, req.body);
    return ok(res, { data });
  }),

  getComments: asyncHandler(async (req, res) => {
    const { rows, meta } = await communityService.getComments(req.params.postId, req.query);
    return ok(res, { data: rows, meta }); // meta có { page, limit, total, pages }
  }),
  getCommentReplies: asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { rows, meta } = await communityService.getCommentReplies(commentId, req.query);
    return ok(res, { data: rows, meta });
  }),

});
