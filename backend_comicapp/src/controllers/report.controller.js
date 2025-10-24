// app/controllers/report.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (reportService) => ({
  // USER
  createReport: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { title, description, type, targetId } = req.body;
    const data = await reportService.createReport({ userId, title, description, type, targetId });
    return ok(res, { data });
  }),

  // ADMIN
  getAllReports: asyncHandler(async (req, res) => {
    const { page, limit, type, isResolved } = req.query;
    const { rows, meta } = await reportService.listReports({ page, limit, type, isResolved });
    return ok(res, { data: rows, meta });
  }),

  resolveReport: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await reportService.resolveReport({  id });
    return ok(res, { data });
  }),

  deleteReport: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await reportService.deleteReport({ id });
    return ok(res, { data });
  }),
});
