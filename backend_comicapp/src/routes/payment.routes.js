// app/routes/payment.routes.js
const express = require("express");
const { sequelize, models } = require("../db");

const walletRepo = require("../repositories/wallet.repo");
const walletTxRepo = require("../repositories/transaction.repo");
const paymentServiceFactory = require("../services/payment.service");
const paymentControllerFactory = require("../controllers/payment.controller");
const momoGatewayFactory = require("../integrations/momo.gateway");


const {protect} = require("../middlewares/auth");

const router = express.Router();

// Khởi tạo dependencies
const momoGateway = momoGatewayFactory();
const paymentService = paymentServiceFactory({
  sequelize,
  model: models,
  walletRepo,
  walletTxRepo,
  momoGateway,
});
const paymentController = paymentControllerFactory(paymentService);

/**
 * GET /api/payments/packages
 * (option) – cho FE lấy bảng giá + số vàng
 */
router.get("/packages", paymentController.getPackages);

/**
 * POST /api/payments/momo-ipn
 * Endpoint cho MoMo gọi IPN – KHÔNG cần auth
 * Bạn nhớ config ipnUrl = "https://domain/api/payments/momo-ipn"
 */
router.post("/momo-ipn", paymentController.handleMoMoIpn);
/**
 * POST /api/payments/momo/topup
 * Body: { packageCode: "TOPUP_50K" }
 */
router.post("/momo/topup", protect, paymentController.createMoMoTopup);



module.exports = router;
