// app/services/notification.service.js
const AppError = require("../utils/AppError");
const { Op } = require("sequelize");
const { emitToUser } = require("../config/socket");

module.exports = ({ model, notificationRepo, deliveryRepo }) => {
  return {
    // GET /notifications?sinceDays=30&limit=100&page=1
    async getNotifications({ userId, sinceDays = 30, limit = 100, page = 1 }) {
      const safeDays = Math.min(Math.max(parseInt(sinceDays) || 30, 1), 180);
      const safeLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
      const currentPage = Math.max(parseInt(page) || 1, 1);
      const offset = (currentPage - 1) * safeLimit;

      const now = new Date();
      const since = new Date(now);
      since.setDate(now.getDate() - safeDays);

      const where = {
        userId,
        deliveredAt: { [Op.between]: [since, now] },
      };

      const include = [
        {
          model: model.Notification,
          attributes: ["notificationId", "category", "audienceType", "title", "message", "createdAt"],
        },
      ];

      const [rows, total] = await Promise.all([
        deliveryRepo.findAll({ where, include, limit: safeLimit, offset }, { model }),
        deliveryRepo.count({ where }, { model }),
      ]);

      return {
        rows,
        meta: {
          page: currentPage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
          sinceDays: safeDays,
        },
      };
    },

    // PUT /notifications/:notificationId/read
    async markAsRead({ userId, notificationId }) {
      const item = await deliveryRepo.findOne({ userId, notificationId }, { model });
      if (!item) throw new AppError("Không tìm thấy thông báo", 404, "NOTIFICATION_NOT_FOUND");
      await deliveryRepo.updateMany({ userId, notificationId }, { isRead: true }, { model });
      return { message: "Đánh dấu đã đọc thành công" };
    },

    // PUT /notifications/read-all
    async markAllAsRead({ userId }) {
      await deliveryRepo.updateMany({ userId, isRead: false }, { isRead: true }, { model });
      return { message: "Đánh dấu tất cả đã đọc thành công" };
    },

    // GET /admin/notifications?limit=20&page=1
    async getAllNotificationsForAdmin({ limit = 20, page = 1 }) {
      const safeLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      const currentPage = Math.max(parseInt(page) || 1, 1);
      const offset = (currentPage - 1) * safeLimit;

      const where = { category: { [Op.in]: ["promotion", "system"] } };

      const [rows, total] = await Promise.all([
        notificationRepo.findAll(
          { where, limit: safeLimit, offset, order: [["createdAt", "DESC"]] },
          { model }
        ),
        notificationRepo.count({ where }, { model }),
      ]);

      return {
        rows,
        meta: {
          page: currentPage,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      };
    },

    // POST /admin/notifications
    async createAdminNotification({ category, title, message }) {
      if (!["promotion", "system"].includes(category))
        throw new AppError("Chỉ được phép tạo thông báo loại 'promotion' hoặc 'system'", 400, "INVALID_CATEGORY");

      //Tạo thông báo gốc
      const notification = await notificationRepo.create(
        { category, audienceType: "global", title, message },
        { model }
      );

      //Lấy toàn bộ userId (tuỳ quy mô, có thể dùng paging hoặc queue nếu user quá lớn)
      const users = await model.User.findAll({ where: { role: { [Op.ne]: "admin" } }, attributes: ["userId"] });
      const deliveries = users.map(u => ({
        notificationId: notification.notificationId,
        userId: u.userId,
        isRead: false,
      }));

      // Tạo các bản ghi giao thông báo
      await model.NotificationDelivery.bulkCreate(deliveries, { ignoreDuplicates: true });

      // Gửi socket real-time (nếu đang kết nối)
      users.forEach(u => {
        emitToUser?.(u.id, "notification:new", {
          notificationId: notification.notificationId,
          category,
          title,
          message,
          isRead: false,
          createdAt: notification.createdAt,
        });
      });

      return notification;
    },

    async createAndNotify({ category, title, message, audienceType = "direct", userId, userIds = [], extra = {} }) {
      // 1) tạo notification gốc
      const notification = await notificationRepo.create(
        { category, audienceType, title, message, ...extra },
        { model }
      );

      // 2) phân phối
      const targets = [];
      if (Array.isArray(userIds) && userIds.length > 0) {
        userIds.forEach((uid) => targets.push({ notificationId: notification.notificationId, userId: uid }));
      } else if (userId) {
        targets.push({ notificationId: notification.notificationId, userId });
      }

      if (targets.length > 0) {
        await deliveryRepo.bulkCreate(targets, { model });
        targets.forEach((t) => {
          emitToUser?.(t.userId, "notification:new", {
            notificationId: notification.notificationId,
            category,
            title,
            message,
            isRead: false,
            createdAt: notification.createdAt,
            ...extra,
          });
        });
      }

      return notification;
    },
  };
};
