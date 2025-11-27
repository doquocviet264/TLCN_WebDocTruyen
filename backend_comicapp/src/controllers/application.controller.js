// app/controllers/application.controller.js
const ok = require("../utils/responses/ok"); // Đảm bảo bạn có file này giống history
const asyncHandler = require("../middlewares/asyncHandler");
const AppError = require("../utils/AppError");

module.exports = (applicationService) => ({
  createBecomeTranslatorApplication: asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { reason } = req.body;
    const data = await applicationService.createBecomeTranslatorApplication(userId, reason);
    // Nếu bạn có helper created thì dùng, không thì dùng ok hoặc res.status(201)
    return ok(res, { message: "Gửi đơn đăng ký làm dịch giả thành công", data });
  }),

  createJoinGroupApplication: asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { groupId, reason } = req.body;
    const data = await applicationService.createJoinGroupApplication(userId, groupId, reason);
    return ok(res, { message: "Gửi đơn xin gia nhập nhóm thành công", data });
  }),

  getUserApplications: asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const data = await applicationService.getUserApplications(userId);
    return ok(res, { message: "Lấy danh sách đơn đăng ký thành công", data });
  }),

  getTranslatorApplications: asyncHandler(async (req, res) => {
    const { status, page, limit } = req.query;
    const data = await applicationService.getTranslatorApplications(status, page, limit);
    return ok(res, { message: "Lấy danh sách đơn đăng ký dịch giả thành công", data });
  }),

  getGroupJoinApplications: asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { status, page, limit } = req.query;
    const data = await applicationService.getGroupJoinApplications(parseInt(groupId), status, page, limit);
    return ok(res, { message: `Lấy danh sách đơn xin vào nhóm (ID: ${groupId}) thành công`, data });
  }),

  reviewTranslatorApplication: asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;
    const { userId: reviewerId } = req.user;

    const updated = await applicationService.reviewTranslatorApplication(parseInt(applicationId), status, reviewerId);

    if (!updated) {
      throw new AppError("Không tìm thấy đơn đăng ký hoặc cập nhật thất bại", 404, "NOT_FOUND");
    }

    return ok(res, { message: "Đã duyệt đơn đăng ký dịch giả thành công" });
  }),

  reviewGroupJoinApplication: asyncHandler(async (req, res) => {
    const { applicationId, groupId } = req.params;
    const { status } = req.body;
    const { userId: reviewerId } = req.user;

    const updated = await applicationService.reviewGroupJoinApplication(parseInt(applicationId), parseInt(groupId), status, reviewerId);

    if (!updated) {
      throw new AppError("Không tìm thấy đơn đăng ký hoặc cập nhật thất bại", 404, "NOT_FOUND");
    }

    return ok(res, { message: "Đã duyệt đơn xin gia nhập nhóm thành công" });
  }),
});