// app/services/group.service.js
const AppError = require("../utils/AppError");

module.exports = ({ sequelize, model, repos }) => {
  const {comicRepo, groupRepo, groupMemberRepo } = repos;
    const { Op } = model.Sequelize;

  return {
    // POST /api/groups
    async createGroup({ ownerId, name, description, avatarUrl }) {
      // 1 user chỉ được làm leader của 1 group
      const existingLeader = await groupMemberRepo.findOne(
        { userId: ownerId, role: "leader" },
        { model }
      );
      if (existingLeader) {
        throw new AppError(
          "Bạn đã là leader của một nhóm khác",
          400,
          "ALREADY_LEADER"
        );
      }

      return sequelize.transaction(async (t) => {
        // tạo group
        const group = await groupRepo.create(
          { name, description, avatarUrl, ownerId },
          { model, transaction: t }
        );

        // thêm owner vào membership với role leader
        await groupMemberRepo.create(
          {
            groupId: group.groupId,
            userId: ownerId,
            role: "leader",
            joinedAt: new Date(),
          },
          { model, transaction: t }
        );

        return group;
      });
    },

    // GET /api/groups?q=&page=&limit=
    async listGroups({ q, page, limit }) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
      const offset = (pageNum - 1) * limitNum;

      let where = {};
      if (q && q.trim()) {
        const keyword = `%${q.trim()}%`;
        where = {
          [Op.or]: [
            { name: { [Op.like]: keyword } },
            { description: { [Op.like]: keyword } },
          ],
        };
      }

      const { rows, count } = await groupRepo.findAndCountAll(where, {
        model,
        include: [
          // chỉ cần biết có bao nhiêu member, không cần chi tiết user
          {
            model: model.TranslationGroupMember,
            as: "memberLinks",
            attributes: ["userId"],
          },
          // để tính số truyện + tổng view
          {
            model: model.Comic,
            as: "comics",
            attributes: ["comicId"],
            include: [
            {
                model: model.Chapter,
                attributes: ["chapterId", "views"],
            },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: limitNum,
        offset,
      });

      const totalPages = Math.ceil(count / limitNum) || 1;

      // Map về dạng summary gọn cho FE
      const items = rows.map((g) => {
        const json = g.toJSON();

        const totalMembers = (json.memberLinks || []).length;
        const totalComics = (json.comics || []).length;
        const totalViews = (json.comics || []).reduce(
          (sum, c) => sum + (c.views || 0),
          0
        );

        return {
          groupId: json.groupId,
          name: json.name,
          description: json.description,
          avatarUrl: json.avatarUrl,
          ownerId: json.ownerId,
          createdAt: json.createdAt,
          stats: {
            totalMembers,
            totalComics,
            totalViews,
          },
        };
      });

      return {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: count,
          totalPages,
        },
      };
    },


    // GET /api/groups/:groupId
    async getGroupDetails({ groupId }) {
    const group = await groupRepo.findById(groupId, {
        model,
        include: [
        { model: model.User, as: "owner" },

        {
            model: model.TranslationGroupMember,
            as: "memberLinks",
            include: [{ model: model.User, as: "user" }],
        },

        {
            model: model.Comic,
            as: "comics",
            include: [
            {
                model: model.Chapter,
                attributes: ["chapterNumber", "views"],
            },
            ],
        },
        ],
    });

    if (!group) {
        throw new AppError("Không tìm thấy nhóm", 404, "GROUP_NOT_FOUND");
    }

    const g = group.toJSON();
    const members = (g.memberLinks || []).map((link) => {
        const u = link.user || {};
        return {
        userId: link.userId,
        username: u.username || "Ẩn danh",
        avatarUrl: u.avatarUrl || null,
        role: link.role,
        joinedAt: link.joinedAt,
        };
    });

    const totalMembers = members.length;

    const comics = (g.comics || []).map((c) => {
        const chapters = c.Chapters || [];

        const views = chapters.reduce(
        (sum, ch) => sum + (ch.views || 0),
        0
        );

        let lastChapterNumber = parseFloat(chapters[chapters.length-1]?.chapterNumber) || null;

        const isCompleted =
        c.isCompleted ??
        (typeof c.status === "string"
            ? c.status.toLowerCase() === "completed"
            : false);

        return {
        comicId: c.comicId,
        title: c.title,
        slug: c.slug,
        coverUrl: c.coverImage || null,
        isCompleted,
        views,
        lastChapterNumber, // number | null
        };
    });

    const totalComics = comics.length;
    const totalViews = comics.reduce(
        (sum, c) => sum + (c.views || 0),
        0
    );

    return {
        groupId: g.groupId,
        name: g.name,
        description: g.description,
        avatarUrl: g.avatarUrl,
        ownerId: g.ownerId,
        createdAt: g.createdAt,

        stats: {
        totalMembers,
        totalComics,
        totalViews,
        },

        members,
        comics,
    };
    },



    // PATCH /api/groups/:groupId
    async updateGroup({ groupId, currentUserId, name, description, avatarUrl }) {
      // chỉ owner hoặc leader mới được sửa
      const group = await groupRepo.findById(groupId, { model });
      if (!group) {
        throw new AppError("Không tìm thấy nhóm", 404, "GROUP_NOT_FOUND");
      }

      const isOwner = group.ownerId === currentUserId;
      const membership = await groupMemberRepo.findOne(
        { groupId, userId: currentUserId },
        { model }
      );
      const isLeader = membership && membership.role === "leader";

      if (!isOwner && !isLeader) {
        throw new AppError(
          "Bạn không có quyền cập nhật nhóm này",
          403,
          "FORBIDDEN"
        );
      }

      await groupRepo.updateById(
        groupId,
        { name, description, avatarUrl },
        { model }
      );

      return { message: "Cập nhật nhóm thành công" };
    },

    // DELETE /api/groups/:groupId
    async deleteGroup({ groupId, currentUserId }) {
      const group = await groupRepo.findById(groupId, { model });
      if (!group) {
        throw new AppError("Không tìm thấy nhóm", 404, "GROUP_NOT_FOUND");
      }

      const isOwner = group.ownerId === currentUserId;
      if (!isOwner) {
        throw new AppError("Chỉ owner mới được xóa nhóm", 403, "FORBIDDEN");
      }

      await sequelize.transaction(async (t) => {
        // xóa membership
        await groupMemberRepo.destroy(
          { groupId },
          { model, transaction: t }
        );
        // xóa group
        await groupRepo.destroyById(groupId, { model, transaction: t });
      });

      return { message: "Xóa nhóm thành công" };
    },

    // POST /api/groups/:groupId/members
    async addMember({ currentUserId, groupId, userId }) {
      const group = await groupRepo.findById(groupId, { model });
      if (!group) throw new AppError("Không tìm thấy nhóm", 404, "GROUP_NOT_FOUND");

      // chỉ leader mới được thêm member
      const leaderMembership = await groupMemberRepo.findOne(
        { groupId, userId: currentUserId },
        { model }
      );
      if (!leaderMembership || leaderMembership.role !== "leader") {
        throw new AppError(
          "Chỉ leader mới được thêm thành viên",
          403,
          "FORBIDDEN"
        );
      }

      // user target tồn tại?
      const targetUser = await model.User.findByPk(userId);
      if (!targetUser)
        throw new AppError("User không tồn tại", 404, "USER_NOT_FOUND");

      // đã là member chưa
      const existing = await groupMemberRepo.findOne(
        { groupId, userId },
        { model }
      );
      if (existing) {
        throw new AppError(
          "User đã là thành viên của nhóm",
          400,
          "ALREADY_MEMBER"
        );
      }

      // check max 5 member (chỉ tính approved member, nhưng ở đây chỉ có member)
      const count = await groupMemberRepo.count(
        { groupId },
        { model }
      );
      if (count >= 5) {
        throw new AppError(
          "Nhóm đã đủ 5 thành viên",
          400,
          "GROUP_FULL"
        );
      }

      await groupMemberRepo.create(
        {
          groupId,
          userId,
          role: "member",
          joinedAt: new Date(),
        },
        { model }
      );

      return { message: "Thêm thành viên thành công" };
    },

    // DELETE /api/groups/:groupId/members/:userId
    async removeMember({ currentUserId, groupId, userId }) {
      const group = await groupRepo.findById(groupId, { model });
      if (!group) throw new AppError("Không tìm thấy nhóm", 404, "GROUP_NOT_FOUND");

      const leaderMembership = await groupMemberRepo.findOne(
        { groupId, userId: currentUserId },
        { model }
      );
      if (!leaderMembership || leaderMembership.role !== "leader") {
        throw new AppError(
          "Chỉ leader mới được xóa thành viên",
          403,
          "FORBIDDEN"
        );
      }

      const targetMembership = await groupMemberRepo.findOne(
        { groupId, userId },
        { model }
      );
      if (!targetMembership) {
        throw new AppError(
          "User không phải thành viên của nhóm",
          400,
          "NOT_MEMBER"
        );
      }

      if (targetMembership.role === "leader") {
        throw new AppError(
          "Không thể xóa leader bằng endpoint này. Hãy chuyển leader trước.",
          400,
          "CANNOT_REMOVE_LEADER"
        );
      }

      await groupMemberRepo.destroy(
        { groupId, userId },
        { model }
      );

      return { message: "Xóa thành viên thành công" };
    },

    // POST /api/groups/:groupId/leave
    async leaveGroup({ currentUserId, groupId }) {
      const membership = await groupMemberRepo.findOne(
        { groupId, userId: currentUserId },
        { model }
      );
      if (!membership) {
        throw new AppError(
          "Bạn không phải thành viên của nhóm này",
          400,
          "NOT_MEMBER"
        );
      }

      if (membership.role === "leader") {
        // có thể cho rời nếu nhóm chỉ còn 1 mình
        const count = await groupMemberRepo.count(
          { groupId },
          { model }
        );
        if (count > 1) {
          throw new AppError(
            "Leader không thể rời nhóm khi còn thành viên khác. Hãy chuyển quyền leader trước.",
            400,
            "LEADER_CANNOT_LEAVE"
          );
        }
      }

      await groupMemberRepo.destroy(
        { groupId, userId: currentUserId },
        { model }
      );

      return { message: "Rời nhóm thành công" };
    },

    // POST /api/groups/:groupId/leader
    async setLeader({ currentUserId, groupId, newLeaderId }) {
      const group = await groupRepo.findById(groupId, { model });
      if (!group) throw new AppError("Không tìm thấy nhóm", 404, "GROUP_NOT_FOUND");

      // chỉ owner hoặc leader hiện tại được chuyển leader
      const currentMembership = await groupMemberRepo.findOne(
        { groupId, userId: currentUserId },
        { model }
      );
      const isOwner = group.ownerId === currentUserId;
      const isLeader = currentMembership && currentMembership.role === "leader";

      if (!isOwner && !isLeader) {
        throw new AppError(
          "Bạn không có quyền chuyển leader",
          403,
          "FORBIDDEN"
        );
      }

      // newLeader phải là member của group
      const newLeaderMembership = await groupMemberRepo.findOne(
        { groupId, userId: newLeaderId },
        { model }
      );
      if (!newLeaderMembership) {
        throw new AppError(
          "User được chọn không phải thành viên của nhóm",
          400,
          "NOT_MEMBER"
        );
      }

      // user mới không được làm leader group khác
      const otherLeader = await groupMemberRepo.findOne(
        { userId: newLeaderId, role: "leader" },
        { model }
      );
      if (otherLeader && otherLeader.groupId !== groupId) {
        throw new AppError(
          "User này đã là leader của nhóm khác",
          400,
          "ALREADY_LEADER"
        );
      }

      // transaction: hạ leader cũ → member, set leader mới
      await sequelize.transaction(async (t) => {
        // hạ leader cũ (nếu đang có)
        const existingLeader = await groupMemberRepo.findOne(
          { groupId, role: "leader" },
          { model, transaction: t }
        );
        if (existingLeader && existingLeader.userId !== newLeaderId) {
          existingLeader.role = "member";
          await existingLeader.save({ transaction: t });
        }

        // set leader mới
        newLeaderMembership.role = "leader";
        await newLeaderMembership.save({ transaction: t });
      });

      return { message: "Cập nhật leader thành công" };
    },

    async getGroupDashboard({ groupId, range = "30d" }) {
      // 1) Kiểm tra nhóm
      const group = await repos.groupRepo.findById(groupId, { model });
      if (!group) throw new AppError("Không tìm thấy nhóm", 404, "GROUP_NOT_FOUND");

      // 2) Tính khoảng thời gian (from/to)
      const now = new Date();
      const days = range === "7d" ? 7 : 30;
      const from = new Date(now);
      from.setDate(from.getDate() - days);

      // 3) Tổng số truyện & chương, views & members
      const comics = await comicRepo.findAll(
        {
          where: { groupId },
          attributes: ["comicId"],
          raw: true,
        },
        { model }
      );

      const comicIds = comics.map((c) => c.comicId);

      const totalComics = comicIds.length;

      const totalChapters = comicIds.length
        ? await model.Chapter.count({ where: { comicId: { [Op.in]: comicIds } } })
        : 0;

      const totalViews = comicIds.length
        ? await model.Chapter.sum("views", { where: { comicId: { [Op.in]: comicIds } } })
        : 0;

      const totalMembers = await model.TranslationGroupMember.count({
        where: { groupId },
      });

      const updatedChaptersLastRange = comicIds.length
        ? await model.Chapter.count({
            where: {
              comicId: { [Op.in]: comicIds },
              updatedAt: { [Op.gte]: from },
            },
          })
        : 0;

      // 4) Activity summary
      const [newComments, newRatings, newFollows, newLikes] = await Promise.all([
        model.Comment.count({
          where: { comicId: { [Op.in]: comicIds }, createdAt: { [Op.gte]: from } },
        }),
        model.ComicRating.count({
          where: { comicId: { [Op.in]: comicIds }, ratingAt: { [Op.gte]: from } },
        }),
        model.ComicFollow.count({
          where: { comicId: { [Op.in]: comicIds }, followDate: { [Op.gte]: from } },
        }),
        model.ComicLike.count({
          where: { comicId: { [Op.in]: comicIds }, likeDate: { [Op.gte]: from } },
        }),
      ]);

      // 5) Trend (views + chương mới theo ngày) – đơn giản: group by date
      const trendRows = await model.Chapter.findAll({
        where: {
          comicId: { [Op.in]: comicIds },
          updatedAt: { [Op.gte]: from },
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("updatedAt")), "date"],
          [sequelize.fn("SUM", sequelize.col("views")), "views"],
          [sequelize.fn("COUNT", sequelize.col("chapterId")), "newChapters"],
        ],
        group: [sequelize.fn("DATE", sequelize.col("updatedAt"))],
        order: [[sequelize.fn("DATE", sequelize.col("updatedAt")), "ASC"]],
        raw: true,
      });

      const trendSeries = trendRows.map((row) => ({
        date: row.date,
        views: Number(row.views) || 0,
        newChapters: Number(row.newChapters) || 0,
      }));

      // 6) Recent activities: lấy 10 hoạt động gần nhất (comment/rating/follow/like)
      const recentComments = await model.Comment.findAll({
        where: { comicId: { [Op.in]: comicIds } },
        include: [{ model: model.Comic, attributes: ["title"] }, { model: model.User, attributes: ["username"] }],
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      const recentActivities = [
        ...recentComments.map((c) => ({
          id: `comment-${c.commentId}`,
          type: "comment",
          userName: c.User?.username || "Ẩn danh",
          comicTitle: c.Comic?.title || "Không rõ",
          action: "bình luận",
          createdAt: c.createdAt,
        })),
        // TODO: thêm rating/follow/like tương tự
      ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 10);

      return {
        groupId,
        stats: {
          totalComics,
          totalChapters,
          totalViews: totalViews || 0,
          totalMembers,
          updatedChaptersLastRange,
        },
        analytics: {
          range,
          series: trendSeries,
        },
        activitySummary: {
          since: from.toISOString(),
          newComments,
          newRatings,
          newFollows,
          newLikes,
        },
        recentActivities,
      };
    },
  };
};
