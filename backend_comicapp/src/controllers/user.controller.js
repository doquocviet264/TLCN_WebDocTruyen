// app/controllers/user.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");
const fs = require("fs/promises");

module.exports = (userService) => ({
  getProfile: asyncHandler(async (req, res) => {
    const data = await userService.getProfile({ userId: req.user.userId });
    return ok(res, { data });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const { username, gender, birthday } = req.body;
    const data = await userService.updateProfile({ userId: req.user.userId, username, gender, birthday });
    return ok(res, { data });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const data = await userService.changePassword({ userId: req.user.userId, currentPassword, newPassword });
    return ok(res, { data });
  }),

  uploadAvatar: asyncHandler(async (req, res) => {
    const filePath = req.file?.path;
    const result = await userService.uploadAvatar({ userId: req.user.userId, filePath });
    // xoá file tạm sau khi service đã up cloudinary
    if (result.tmpPath) {
      try { await fs.unlink(result.tmpPath); } catch {}
      delete result.tmpPath;
    }
    return ok(res, { data: result });
  }),

  getGoldDetails: asyncHandler(async (req, res) => {
    const data = await userService.getGoldDetails({ userId: req.user.userId });
    return ok(res, { data });
  }),

  performCheckIn: asyncHandler(async (req, res) => {
    const data = await userService.performCheckIn({ userId: req.user.userId });
    return ok(res, { data });
  }),

  getUserActivity: asyncHandler(async (req, res) => {
    const data = await userService.getUserActivity({ userId: req.user.userId });
    return ok(res, { data });
  }),
  getMyComments: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const limit  = Math.max(1, Math.min(50, Number(req.query.limit) || 5));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const data = await userService.getMyComments({ userId, limit, offset });
    return ok(res, { data, meta: { limit, offset } });
  }),

  // Admin
  getAllUsers: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const { users, meta } = await userService.getAllUsers({ page, limit: 10 });
    return ok(res, { data: users, meta });
  }),

  toggleUserStatus: asyncHandler(async (req, res) => {
    const { userId, action } = req.params;
    const data = await userService.toggleUserStatus({ userId, action });
    return ok(res, { data });
  }),

  promoteToAdmin: asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const data = await userService.promoteToAdmin({ userId });
    return ok(res, { data });
  }),
});
