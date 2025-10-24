// app/controllers/auth.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (authService) => ({
  register: asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    return ok(res, { data });
  }),
  resendOTP: asyncHandler(async (req, res) => {
    const data = await authService.resendOTP(req.body);
    return ok(res, { data });
  }),
  verifyOTP: asyncHandler(async (req, res) => {
    const data = await authService.verifyOTP(req.body);
    return ok(res, { data });
  }),
  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    return ok(res, { data });
  }),
  forgotPassword: asyncHandler(async (req, res) => {
    const data = await authService.forgotPassword(req.body);
    return ok(res, { data });
  }),
  resetPassword: asyncHandler(async (req, res) => {
    const data = await authService.resetPassword(req.body);
    return ok(res, { data });
  }),
});
