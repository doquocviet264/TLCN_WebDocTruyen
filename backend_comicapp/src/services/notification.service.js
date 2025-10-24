// app/services/notification.service.js
const AppError = require("../utils/AppError");


module.exports = ({ model, notificationRepo }) => {
  return {
    // GET /notifications?sinceDays=30&limit=100&page=1
    async getNotifications({ userId, sinceDays = 30, limit = 100, page = 1 }) {
      const safeDays = Math.min(Math.max(parseInt(sinceDays) || 30, 1), 180);
      const safeLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 200);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * safeLimit;

      const now = new Date();
      const since = new Date(now);
      since.setDate(now.getDate() - safeDays); 

      const where = {
        userId,
        createdAt: { [model.Sequelize.Op.between]: [since, now] },
      };

      const [rows, total] = await Promise.all([
        notificationRepo.findAll({ where, limit: safeLimit, offset }, { model }),
        notificationRepo.count({ where }, { model }),
      ]);

      return {
        rows,
        meta: {
          page: Math.floor(offset / safeLimit) + 1,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
          sinceDays: safeDays,
        },
      };
    },

    // PUT /notifications/:notificationId/read
    async markAsRead({ userId, notificationId }) {
      const item = await notificationRepo.findOne({ notificationId, userId }, { model });
      if (!item) throw new AppError("Không tìm thấy thông báo", 404, "NOTIFICATION_NOT_FOUND");
      await notificationRepo.updateById(notificationId, { isRead: true }, { model });
      return { message: "Đánh dấu đã đọc thành công" };
    },

    // PUT /notifications/read-all
    async markAllAsRead({ userId }) {
      await notificationRepo.updateMany({ userId, isRead: false }, { isRead: true }, { model });
      return { message: "Đánh dấu tất cả đã đọc thành công" };
    },

    async createAndNotify({ userId, category, title, message, extra = {} }) {
      // repo cần có method create
      const created = await notificationRepo.create(
        { userId, category, title, message, isRead: false, ...extra },
        { model }
      );

      emitToUser(userId, "notification:new", {
        notificationId: created.notificationId,
        category,
        title,
        message,
        isRead: created.isRead,
        createdAt: created.createdAt,
        ...extra,
      });

      return created;
    },
  };
};
