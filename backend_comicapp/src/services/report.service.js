// app/services/report.service.js
const AppError = require("../utils/AppError");

module.exports = ({ model, repos }) => {
  const { reportRepo } = repos;
  const allowedTypes = new Set(["comment", "chapter"]);

  async function enrichReportTarget(report, { model }) {
    // Gắn thêm info target (comment/chapter) giống code cũ của bạn
    if (report.type === "comment" && report.targetId) {
      const target = await model.Comment.findByPk(report.targetId, {
        attributes: ["content", "createdAt"],
        include: [{ model: model.User, attributes: ["username"] }],
      });
      return { ...report.toJSON(), target };
    }
    if (report.type === "chapter" && report.targetId) {
      const target = await model.Chapter.findByPk(report.targetId, {
        attributes: ["title", "chapterNumber"],
        include: [{ model: model.Comic, attributes: ["title"] }],
      });
      return { ...report.toJSON(), target };
    }
    return report.toJSON();
  }

  return {
    // USER: POST /reports
    async createReport({ userId, title, description, type, targetId }) {
      if (!title || !description || !type ) {
        throw new AppError("Thiếu thông tin báo cáo", 400, "VALIDATION_ERROR");
      }
      if (!allowedTypes.has(type)) {
        throw new AppError("Loại báo cáo không hợp lệ", 400, "INVALID_TYPE");
      }
      // Kiểm tra target tồn tại
      if (type === "comment") {
        const exists = await model.Comment.findByPk(targetId);
        if (!exists) throw new AppError("Bình luận không tồn tại", 404, "COMMENT_NOT_FOUND");
      } else if (type === "chapter") {
        const exists = await model.Chapter.findByPk(targetId);
        if (!exists) throw new AppError("Chương không tồn tại", 404, "CHAPTER_NOT_FOUND");
      }

      const report = await reportRepo.create(
        { userId, title, description, type, targetId, isResolved: false },
        { model }
      );
      return report;
    },

    // ADMIN: GET /reports/admin
    async listReports({ page = 1, limit = 20, type, isResolved }) {
      const where = {};
      if (type && allowedTypes.has(type)) where.type = type;
      if (typeof isResolved !== "undefined") where.isResolved = String(isResolved) === "true";

      const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const safePage = Math.max(parseInt(page, 10) || 1, 1);
      const offset = (safePage - 1) * safeLimit;

      const include = [
        { model: model.User, as: "user", attributes: ["userId", "username", "email", "avatar"] },
      ];

      const { count, rows } = await reportRepo.findAndCountAll(
        { where, limit: safeLimit, offset, include },
        { model }
      );

      // Enrich target info
      const enriched = [];
      for (const r of rows) {
        enriched.push(await enrichReportTarget(r, { model }));
      }

      return {
        rows: enriched,
        meta: {
          page: safePage,
          limit: safeLimit,
          total: count,
          totalPages: Math.max(1, Math.ceil(count / safeLimit)),
        },
      };
    },

    // ADMIN: PUT /reports/admin/:id/resolve
    async resolveReport({ id }) {
      const report = await reportRepo.findByPk(id, { model });
      if (!report) throw new AppError("Không tìm thấy báo cáo", 404, "REPORT_NOT_FOUND");

      await reportRepo.updateById(id, { isResolved: true, resolvedAt: new Date() }, { model });
      return { message: "Đã đánh dấu báo cáo là đã giải quyết" };
    },

    // ADMIN: DELETE /reports/admin/:id
    async deleteReport({ id }) {
      const deleted = await reportRepo.destroyById(id, { model });
      if (!deleted) throw new AppError("Không tìm thấy báo cáo", 404, "REPORT_NOT_FOUND");
      return { message: "Đã xóa báo cáo" };
    },
  };
};
