// app/controllers/payment.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (paymentService) => ({
  // GET /api/payments/packages (optional)
  getPackages: asyncHandler(async (req, res) => {
    const data = paymentService.getPackages();
    return ok(res, { data });
  }),

  // POST /api/payments/momo/topup
  createMoMoTopup: asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { packageCode } = req.body; // method FE chọn "momo" rồi nên ở đây chỉ cần packageCode

    const data = await paymentService.createMoMoTopup({
      userId,
      packageCode,
    });

    return ok(res, { data });
  }),

  // POST /api/payments/momo-ipn  (IPN từ MoMo gọi vào)
  handleMoMoIpn: asyncHandler(async (req, res) => {
    const payload = req.body;
    const data = await paymentService.handleMoMoIpn(payload);

    // IPN thường chỉ cần trả JSON cơ bản cho MoMo
    return res.json(data);
  }),
});
