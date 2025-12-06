// app/services/dashboard.service.js
const AppError = require("../utils/AppError");

module.exports = ({ sequelize, model }) => {
  const { Sequelize } = model;
  const { Op } = Sequelize;

  function normalizeDateRange(from, to) {
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = from ? new Date(from) : new Date(end);
    // mặc định lấy 7 ngày gần nhất
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  }

  return {
    /**
     * Tổng quan cho Dashboard
     * - Tổng user, user mới trong khoảng
     * - Tổng comic, comic mới trong khoảng
     * - Tổng view ALL TIME (Chapter.views)
     * - Ví & giao dịch (all time)
     * - Report, community trong khoảng
     */
    async getOverview({ from, to }) {
      const { start, end } = normalizeDateRange(from, to);

      const [
        totalUsers,
        newUsers,
        totalComics,
        newComics,
        totalViewsAllTime,
        totalGoldInSystem,
        goldTopupAllTime,
        goldSpentOnChaptersAllTime,
        totalReports,
        pendingReports,
        resolvedReports,
        totalPosts,
        totalComments,
      ] = await Promise.all([
        // Users
        model.User.count(),
        model.User.count({
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
        }),

        // Comics
        model.Comic.count(),
        model.Comic.count({
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
        }),

        // Views all-time (KHÔNG ước tính theo ngày nữa)
        model.Chapter.sum("views"),

        // Wallet
        model.Wallet.sum("balance"),

        // Transaction: all-time, không filter theo createdAt
        model.Transaction.sum("amount", {
          where: {
            type: "credit",
            status: "success",
          },
        }),
        model.Transaction.sum("amount", {
          where: {
            type: "debit",
            status: "success",
            chapterId: { [Op.ne]: null },
          },
        }),

        // Reports trong khoảng
        model.Report.count({
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
        }),
        model.Report.count({
          where: {
            isResolved: false,
            createdAt: { [Op.between]: [start, end] },
          },
        }),
        model.Report.count({
          where: {
            isResolved: true,
            createdAt: { [Op.between]: [start, end] },
          },
        }),

        // Community trong khoảng
        model.Post
          ? model.Post.count({
              where: {
                createdAt: { [Op.between]: [start, end] },
              },
            })
          : Promise.resolve(null),
        model.Comment.count({
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
        }),
      ]);

      return {
        range: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        overview: {
          users: {
            total: totalUsers,
            newInRange: newUsers,
          },
          comics: {
            total: totalComics,
            newInRange: newComics,
          },
          // KHÔNG còn inRange dựa trên ReadingHistory
          views: {
            totalAllTime: totalViewsAllTime || 0,
          },
          wallet: {
            totalGoldInSystem: totalGoldInSystem || 0,
            goldTopupAllTime: goldTopupAllTime || 0,
            goldSpentOnChaptersAllTime: goldSpentOnChaptersAllTime || 0,
          },
          reports: {
            totalInRange: totalReports,
            pending: pendingReports,
            resolved: resolvedReports,
          },
          community: {
            totalPosts: totalPosts ?? 0,
            totalComments,
          },
        },
      };
    },

    /**
     * Biểu đồ user mới theo ngày
     */
    async getUserChart({ from, to }) {
      const { start, end } = normalizeDateRange(from, to);

      const rows = await model.User.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
          [sequelize.fn("COUNT", "*"), "count"],
        ],
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
        order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
        raw: true,
      });

      const data = rows.map((r) => ({
        date: r.date,
        count: Number(r.count),
      }));

      return {
        range: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        data,
      };
    },

    /**
     * Biểu đồ: SỐ TRUYỆN MỚI & CHAPTER MỚI THEO NGÀY
     * (Thay cho “lượt đọc theo ngày”)
     */
    async getViewChart({ from, to }) {
      const { start, end } = normalizeDateRange(from, to);

      const comicsByDay = await model.Comic.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
          [sequelize.fn("COUNT", "*"), "comics"],
        ],
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
        order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
        raw: true,
      });

      const chaptersByDay = await model.Chapter.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
          [sequelize.fn("COUNT", "*"), "chapters"],
        ],
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
        order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
        raw: true,
      });

      const map = new Map();
      comicsByDay.forEach((row) => {
        map.set(row.date, {
          date: row.date,
          comics: Number(row.comics),
          chapters: 0,
        });
      });
      chaptersByDay.forEach((row) => {
        if (map.has(row.date)) {
          map.get(row.date).chapters = Number(row.chapters);
        } else {
          map.set(row.date, {
            date: row.date,
            comics: 0,
            chapters: Number(row.chapters),
          });
        }
      });

      const data = Array.from(map.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      return {
        range: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        data, // { date, comics, chapters }
      };
    },

    /**
     * Top comics vẫn dùng ReadingHistory (nếu bạn muốn bỏ luôn thì đổi sang Chapter.views)
     */
    async getTopComics({ from, to, limit = 5 }) {
      if (!model.ReadingHistory) {
        throw new AppError(
          "ReadingHistory không tồn tại trong model",
          500,
          "READING_HISTORY_MODEL_MISSING"
        );
      }

      const { start, end } = normalizeDateRange(from, to);

      const rows = await model.Chapter.findAll({
        attributes: ["comicId", [sequelize.fn("COUNT", "*"), "views"]],
        include: [
          {
            model: model.Comic,
            attributes: ["comicId", "title", "slug", "coverImage"],
          },
        ],
        group: [
          "comicId",
          "Comic.comicId",
          "Comic.title",
          "Comic.slug",
          "Comic.coverImage",
        ],
        order: [[sequelize.literal("views"), "DESC"]],
        limit: Number(limit) || 5,
        raw: true,
        nest: true,
      });

      const data = rows.map((r) => ({
        comicId: r.comicId,
        title: r.Comic?.title,
        slug: r.Comic?.slug,
        coverUrl: r.Comic?.coverUrl,
        views: Number(r.views),
      }));

      return {
        range: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        data,
      };
    },

    /**
     * Top user nạp nhiều vàng nhất (all time)
     */
    async getTopUsers({ limit = 5 }) {
      const topRows = await model.Transaction.findAll({
        attributes: [
          [sequelize.col("Wallet.userId"), "userId"],
          [sequelize.fn("SUM", sequelize.col("amount")), "totalTopup"],
        ],
        where: {
          type: "credit",
          status: "success",
        },
        include: [
          {
            model: model.Wallet,
            attributes: [],
          },
        ],
        group: ["Wallet.userId"],
        order: [[sequelize.literal("totalTopup"), "DESC"]],
        limit: Number(limit) || 5,
        raw: true,
      });

      const userIds = topRows.map((r) => r.userId);
      const users = await model.User.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: ["userId", "username", "email", "avatar"],
        raw: true,
      });

      const userMap = new Map(users.map((u) => [u.userId, u]));

      const data = topRows.map((row) => {
        const u = userMap.get(row.userId) || {};
        return {
          userId: row.userId,
          username: u.username || `User #${row.userId}`,
          email: u.email || null,
          avatar: u.avatar || null,
          totalTopup: Number(row.totalTopup) || 0,
        };
      });

      return {
        range: null, // không lọc theo khoảng thời gian
        data,
      };
    },

    /**
     * Thống kê report theo loại & trạng thái
     */
    async getReportStats({ from, to }) {
      const { start, end } = normalizeDateRange(from, to);

      const [byType, byStatus] = await Promise.all([
        model.Report.findAll({
          attributes: [
            "type",
            [sequelize.fn("COUNT", "*"), "count"],
          ],
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
          group: ["type"],
          raw: true,
        }),
        model.Report.findAll({
          attributes: [
            "isResolved",
            [sequelize.fn("COUNT", "*"), "count"],
          ],
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
          group: ["isResolved"],
          raw: true,
        }),
      ]);

      return {
        range: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        byType: byType.map((r) => ({
          type: r.type,
          count: Number(r.count),
        })),
        byStatus: byStatus.map((r) => ({
          isResolved: !!r.isResolved,
          count: Number(r.count),
        })),
      };
    },

    /**
     * Thống kê community (post, comment) chi tiết hơn
     */
    async getCommunityStats({ from, to }) {
      const { start, end } = normalizeDateRange(from, to);

      if (!model.Post) {
        throw new AppError(
          "Post model không tồn tại",
          500,
          "POST_MODEL_MISSING"
        );
      }

      const [postsByDay, commentsByDay] = await Promise.all([
        model.Post.findAll({
          attributes: [
            [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
            [sequelize.fn("COUNT", "*"), "count"],
          ],
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
          group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
          order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
          raw: true,
        }),
        model.Comment.findAll({
          attributes: [
            [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
            [sequelize.fn("COUNT", "*"), "count"],
          ],
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
          group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
          order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "ASC"]],
          raw: true,
        }),
      ]);

      return {
        range: {
          from: start.toISOString(),
          to: end.toISOString(),
        },
        posts: postsByDay.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
        comments: commentsByDay.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
      };
    },
  };
};
