// app/services/application.service.js
const AppError = require("../utils/AppError");

module.exports = ({ sequelize, model, applicationRepo }) => {
  return {
    // POST /applications/become-translator
    async createBecomeTranslatorApplication(userId, reason) {
      // Dùng trực tiếp model.User
      const user = await model.User.findByPk(userId);
      if (!user) {
        throw new AppError("Không tìm thấy người dùng", 404, "NOT_FOUND");
      }

      if (user.role === "translator" || user.role === "admin") {
        throw new AppError(
          "Người dùng này đã là Dịch giả hoặc Quản trị viên",
          400,
          "VALIDATION_ERROR"
        );
      }

      const hasPending = await applicationRepo.hasPendingApplication(
        { userId, type: "become_translator" },
        { model }
      );
      if (hasPending) {
        throw new AppError(
          "Bạn đang có một đơn đăng ký làm dịch giả chờ duyệt",
          400,
          "VALIDATION_ERROR"
        );
      }

      return applicationRepo.createApplication(
        {
          userId,
          type: "become_translator",
          reason,
          status: "pending",
        },
        { model }
      );
    },

    // POST /applications/join-group
    async createJoinGroupApplication(userId, groupId, reason) {
      const user = await model.User.findByPk(userId);
      if (!user) {
        throw new AppError("Không tìm thấy người dùng", 404, "NOT_FOUND");
      }

      if (user.role !== "translator" && user.role !== "admin") {
        throw new AppError(
          "Chỉ tài khoản Dịch giả mới có thể xin gia nhập nhóm",
          403,
          "FORBIDDEN"
        );
      }

      const group = await model.TranslationGroup.findByPk(groupId);
      if (!group) {
        throw new AppError("Không tìm thấy nhóm dịch", 404, "NOT_FOUND");
      }

      // Kiểm tra đã là member chưa
      const isMember = await model.TranslationGroupMember.findOne({
        where: { userId, groupId },
      });
      if (isMember) {
        throw new AppError(
          "Bạn đã là thành viên của nhóm này rồi",
          400,
          "VALIDATION_ERROR"
        );
      }

      const hasPending = await applicationRepo.hasPendingApplication(
        { userId, type: "join_group", targetId: groupId },
        { model }
      );

      if (hasPending) {
        throw new AppError(
          "Bạn đang có một đơn xin vào nhóm này chờ duyệt",
          400,
          "VALIDATION_ERROR"
        );
      }

      return applicationRepo.createApplication(
        {
          userId,
          type: "join_group",
          reason,
          targetId: groupId,
          status: "pending",
        },
        { model }
      );
    },

    // GET /applications/mine
    async getUserApplications(userId) {
      return applicationRepo.findApplicationsByUserId(userId, { model });
    },

    // GET /admin/translators
    async getTranslatorApplications(status, page, limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      const where = {
        type: "become_translator", // chỉ lấy đơn xin làm dịch giả
      };

      if (status) {
        where.status = status; // pending / approved / rejected
      }

      const { rows, count } = await model.Application.findAndCountAll({
        where,
        include: [
          {
            model: model.User,
            as: "applicant",
            attributes: ["userId", "username", "avatar"],
          },
          {
            model: model.TranslationGroup,
            as: "targetGroup",
            attributes: ["groupId", "name", "avatarUrl"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: limitNum,
        offset,
      });

      return {
        rows,
        meta: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(count / limitNum),
        }
      };
    },

    // GET /groups/:groupId/applications
    async getGroupJoinApplications(groupId, status, page, limit) {
      const group = await model.TranslationGroup.findByPk(groupId);
      if (!group) {
        throw new AppError("Không tìm thấy nhóm dịch", 404, "NOT_FOUND");
      }

      return applicationRepo.findGroupJoinApplications(
        { groupId, status, page, limit },
        { model }
      );
    },

    // PATCH /admin/translators/:applicationId
    async reviewTranslatorApplication(applicationId, status, reviewerId) {
      const t = await sequelize.transaction();
      try {
        // 1. Tìm đơn bằng model.Application
        const application = await model.Application.findOne({
          where: { applicationId, type: "become_translator" },
          transaction: t,
        });

        if (!application) {
          throw new AppError("Không tìm thấy đơn đăng ký", 404, "NOT_FOUND");
        }

        if (application.status !== "pending") {
          throw new AppError(
            `Đơn này đã được xử lý rồi (Trạng thái: ${application.status})`,
            400,
            "VALIDATION_ERROR"
          );
        }

        // 2. Cập nhật trạng thái đơn
        await application.update(
          {
            status,
            reviewedBy: reviewerId,
          },
          { transaction: t }
        );

        // 3. Nếu approve → nâng user thành translator
        if (status === "approved") {
          await model.User.update(
            { role: "translator" },
            {
              where: { userId: application.userId },
              transaction: t,
            }
          );
        }

        await t.commit();
        return application; // return đơn đã updated
      } catch (error) {
        await t.rollback();
        throw error;
      }
    },


    // PATCH /groups/:groupId/applications/:applicationId
    async reviewGroupJoinApplication(applicationId, groupId, status, reviewerId) {
      const t = await sequelize.transaction();
      try {
        const application = await applicationRepo.findApplicationById(
          applicationId,
          { model }
        );
        if (!application) {
          throw new AppError("Không tìm thấy đơn đăng ký", 404, "NOT_FOUND");
        }

        if (
          application.type !== "join_group" ||
          application.targetId !== groupId
        ) {
          throw new AppError(
            "Đơn đăng ký không hợp lệ hoặc không thuộc về nhóm này",
            400,
            "VALIDATION_ERROR"
          );
        }

        if (application.status !== "pending") {
          throw new AppError(
            `Đơn này đã được xử lý rồi (Trạng thái: ${application.status})`,
            400,
            "VALIDATION_ERROR"
          );
        }

        const updated = await applicationRepo.updateApplicationStatus(
          applicationId,
          status,
          reviewerId,
          { model, transaction: t }
        );

        if (status === "approved") {
          await model.TranslationGroupMember.create(
            { userId: application.userId, groupId },
            { transaction: t }
          );
        }

        await t.commit();
        return updated;
      } catch (error) {
        await t.rollback();
        throw error;
      }
    },
  };
};
