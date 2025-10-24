// app/controllers/notification.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (notificationService) => ({
  getNotifications: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { sinceDays, limit, page } = req.query;
    const { rows, meta } = await notificationService.getNotifications({ userId, sinceDays, limit, page });
    return ok(res, { data: rows, meta });
  }),

  markAsRead: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { notificationId } = req.params;
    const data = await notificationService.markAsRead({ userId, notificationId });
    return ok(res, { data });
  }),

  markAllAsRead: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const data = await notificationService.markAllAsRead({ userId });
    return ok(res, { data });
  }),

  getAllNotificationsForAdmin: asyncHandler(async (req, res) => {
    const { limit, page } = req.query;
    const { rows, meta } = await notificationService.getAllNotificationsForAdmin({ limit, page });
    return ok(res, { data: rows, meta });
  }),

  createAdminNotification: asyncHandler(async (req, res) => {
  const { category, title, message } = req.body;

  const notification = await notificationService.createAdminNotification({
    category,
    title,
    message,
  });

  return ok(res, { data: notification });
}),
});
