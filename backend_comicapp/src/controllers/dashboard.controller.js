// app/controllers/dashboard.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (dashboardService) => ({
  getOverview: asyncHandler(async (req, res) => {
    const data = await dashboardService.getOverview(req.query);
    return ok(res, { data });
  }),

  getUserChart: asyncHandler(async (req, res) => {
    const data = await dashboardService.getUserChart(req.query);
    return ok(res, { data });
  }),

  getViewChart: asyncHandler(async (req, res) => {
    const data = await dashboardService.getViewChart(req.query);
    return ok(res, { data });
  }),

  getTopComics: asyncHandler(async (req, res) => {
    const data = await dashboardService.getTopComics(req.query);
    return ok(res, { data });
  }),

  getTopUsers: asyncHandler(async (req, res) => {
    const data = await dashboardService.getTopUsers(req.query); // vẫn OK, service tự bỏ qua from/to
    return ok(res, { data });
  }),

  getReportStats: asyncHandler(async (req, res) => {
    const data = await dashboardService.getReportStats(req.query);
    return ok(res, { data });
  }),

  getCommunityStats: asyncHandler(async (req, res) => {
    const data = await dashboardService.getCommunityStats(req.query);
    return ok(res, { data });
  }),
});
