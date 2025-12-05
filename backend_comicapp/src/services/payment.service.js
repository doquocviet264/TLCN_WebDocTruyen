// app/services/payment.service.js
const AppError = require("../utils/AppError");

// Gói nạp: BE tự định nghĩa
const TOPUP_PACKAGES = {
  TOPUP_10K: { amountVnd: 10000, goldAmount: 100 },
  TOPUP_20K: { amountVnd: 20000, goldAmount: 220 },
  TOPUP_50K: { amountVnd: 50000, goldAmount: 600 },
  TOPUP_100K: { amountVnd: 100000, goldAmount: 1300 },
  TOPUP_200K: { amountVnd: 200000, goldAmount: 2700 },
  TOPUP_500K: { amountVnd: 500000, goldAmount: 7000 },
};

// Lưu tạm orderId -> thông tin (user, amount, gold, status)
const momoOrders = {};

module.exports = ({ sequelize, model, walletRepo, walletTxRepo, momoGateway }) => {
  return {
    getPackages() {
      return Object.entries(TOPUP_PACKAGES).map(([code, cfg]) => ({
        code,
        amountVnd: cfg.amountVnd,
        goldAmount: cfg.goldAmount,
      }));
    },

    /**
     * Tạo giao dịch MoMo (tương đương View -> Controller -> Service -> Gateway)
     * - FE gửi: { packageCode, method: "momo" }
     */
    async createMoMoTopup({ userId, packageCode }) {
      if (!userId) {
        throw new AppError("Chưa đăng nhập", 401, "UNAUTHORIZED");
      }

      const pkg = TOPUP_PACKAGES[packageCode];
      if (!pkg) {
        throw new AppError("Gói nạp không hợp lệ", 400, "INVALID_PACKAGE");
      }

      const { amountVnd, goldAmount } = pkg;

      // Gọi cổng MoMo
      const result = await momoGateway.createPayment({
        amount: amountVnd,
        userId,
      });

      const data = result.raw;

      // Nếu MoMo trả lỗi thì báo luôn
      if (!data || data.resultCode !== 0 || !data.payUrl) {
        const msg = (data && data.message) || "Không tạo được đơn thanh toán MoMo";
        throw new AppError(msg, 400, "MOMO_CREATE_FAILED");
      }

      // Lưu tạm order để IPN xử lý tiếp
      momoOrders[result.orderId] = {
        userId,
        amountVnd,
        goldAmount,
        packageCode,
        status: "pending",
      };

      return {
        message: "Tạo giao dịch thành công, chuyển sang MoMo",
        orderId: result.orderId,
        payUrl: data.payUrl,
        deeplink: data.deeplink || null,
      };
    },

    /**
     * Xử lý IPN từ MoMo (tương đương Gateway -> Service -> Repo -> DB)
     * Đây mới là bước "Giao dịch Thành công" trong UML
     */
    async handleMoMoIpn(payload) {


      const { orderId, amount, resultCode } = payload;

      const order = momoOrders[orderId];
      if (!order) {
        // Thực tế nên log để debug, vẫn trả success để MoMo không spam lại quá nhiều
        return { success: false, message: "Order not found (memory)" };
      }


      if (resultCode !== 0) {
        order.status = "failed";
        return { success: false, message: "Thanh toán thất bại từ MoMo" };
      }

      // Kiểm tra amount từ MoMo có khớp amountVnd trong order
      if (Number(amount) !== Number(order.amountVnd)) {
        order.status = "failed";
        return { success: false, message: "Số tiền IPN không khớp" };
      }

      // Thanh toán thành công -> cộng vàng & save transaction
      const { userId, goldAmount, packageCode, amountVnd } = order;

      await sequelize.transaction(async (t) => {
        const wallet = await walletRepo.findOne(
        { userId },  // where
        { model, transaction: t }
        );


        // Cộng vàng
        await walletRepo.incrementBalance(wallet.walletId, goldAmount, {
          model,
          transaction: t,
        });

        const updatedWallet = await model.Wallet.findByPk(wallet.walletId, {
          transaction: t,
        });

        // Lưu giao dịch
        await walletTxRepo.create(
          {
            walletId: wallet.walletId,
            status: "success",
            type: "credit",
            description: `Nạp gói ${packageCode} qua MoMo`,
            amount: goldAmount,
            
          },
          { model, transaction: t }
        );

        order.status = "success";
        order.newBalance = updatedWallet.balance;
      });

      return {
        success: true,
        newBalance: order.newBalance,
        goldAdded: order.goldAmount,
      };
    },
  };
};
