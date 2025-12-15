// app/services/comment.service.js
const chapter = require("../models/chapter.js");
const AppError = require("../utils/AppError");
const { parsePaging, buildMeta } = require('../utils/paging'); 
const createUpdateQuestService = require("./update-quest.service");
const makeNotificationService = require("./notification.service.js")
module.exports = ({ sequelize, model, repos }) => {
  const { commentRepo, commentLikeRepo, notificationRepo, reportRepo, userQuestRepo } = repos;
  const { updateQuestProgress } = createUpdateQuestService({ model, userQuestRepo });
  const notificationService = makeNotificationService({ model, notificationRepo, deliveryRepo: repos.deliveryRepo });
  return {
    // GET /comments/comic/:slug?page=
  async getCommentsByComic({ slug, page = 1, limit = 10, userId = null }) {
    const { page: p, limit: l, offset } = parsePaging({ page, limit });

    const { count, rows } = await commentRepo.findAndCountRootByComicSlug(
      { slug, limit: l, offset },
      { model }
    );

    // Lấy list commentId của root comments
    const commentIds = rows.map((c) => c.commentId);

    // Đếm likes cho từng commentId (root)
    const likesMap = new Map();
    for (const id of commentIds) {
      const n = await commentLikeRepo.countByComment(id, { model });
      likesMap.set(id, n);
    }

    // Lấy danh sách commentId user đã like (có thể bao gồm cả replies nếu bạn muốn)
    const likedSet = new Set();
    if (userId) {
      const likedRows = await commentLikeRepo.findAllByUser(userId, { model });
      likedRows.forEach((r) => likedSet.add(r.commentId));
    }

    const comments = rows.map((c) => {
      const plain = c.get({ plain: true });

      const user = plain.user || plain.User || null;

      const replies = (plain.replies || []).map((r) => {
        const ru = r.user || r.User || null;
        return {
          commentId: r.commentId,
          content: r.content,
          createdAt: r.createdAt,
          likes: likesMap.get(r.commentId) || 0, // nếu bạn cũng muốn tính likes cho reply thì nên làm thêm map riêng
          isLiked: userId ? likedSet.has(r.commentId) : false,
          user: ru
            ? {
                username: ru.username,
                avatar: ru.avatar,
              }
            : null,
        };
      });

      return {
        commentId: plain.commentId,
        content: plain.content,
        createdAt: plain.createdAt,
        likes: likesMap.get(plain.commentId) || 0,
        isLiked: userId ? likedSet.has(plain.commentId) : false,
        user: user
          ? {
              username: user.username,
              avatar: user.avatar,
            }
          : null,
        replies,
      };
    });

    return {
      comments,
      meta: buildMeta({ page: p, limit: l, total: count }),
    };
  },

    // GET /comments/chapter/:chapterId?page=
    async getCommentsByChapter({ chapterId, page = 1, limit = 10, userId = null }) {
      const { page: p, limit: l, offset } = parsePaging({ page, limit });

      // Lấy danh sách comment gốc + replies
      const { count, rows } = await commentRepo.findAndCountRootByChapterId(
        { chapterId, limit: l, offset }, // <-- Dùng repo function mới
        { model }
      );

      // Logic tính like/isLiked (giống hệt ở trên)
      const commentIds = rows.map((c) => c.commentId);
      const likesMap = new Map();
      for (const id of commentIds) {
        const n = await commentLikeRepo.countByComment(id, { model });
        likesMap.set(id, n);
      }
      const likedSet = new Set();
      if (userId) {
        const likedRows = await commentLikeRepo.findAllByUser(userId, { model });
        likedRows.forEach((r) => likedSet.add(r.commentId));
      }

      // Format data
      const comments = rows.map((c) => {
        const plain = c.get({ plain: true });
        return {
          ...plain,
          likes: likesMap.get(plain.commentId) || 0,
          isLiked: userId ? likedSet.has(plain.commentId) : false,
        };
      });

      return {
        comments,
        meta: buildMeta({ page: p, limit: l, total: count }),
      };
    },

    // POST /comments
    async createComment({ comicId, content, parentId, userId, chapterId  }) {
      if (!content) throw new AppError("Nội dung bình luận là bắt buộc", 400, "VALIDATION_ERROR");

      const newComment = await commentRepo.create({ comicId, userId, content, parentId, chapterId }, { model });

      // Lấy lại kèm user
      const result = await commentRepo.findByPk(newComment.commentId, {
        model,
        include: [{ model: model.User, attributes: ["username", "avatar"] }],
      });

      // Nâng tiến độ quest
      try {
        await updateQuestProgress({
          userId,
          category: "comment",
        });
      } catch (err) {
        console.error("updateQuestProgress error:", err);
      }

      return result.get({ plain: true });
    },

    // POST /comments/:commentId/like
    async toggleLikeComment({ commentId, userId }) {
      const existing = await commentLikeRepo.findOne({ userId, commentId }, { model });
      if (existing) {
        await commentLikeRepo.destroy({ userId, commentId }, { model });
        return { liked: false, message: "Bỏ thích thành công" };
      } else {
        await commentLikeRepo.create({ userId, commentId }, { model });
        return { liked: true, message: "Thích thành công" };
      }
    },

    // GET /comments/recent
    async getRecentComments({ limit = 10 }) {
      const { col } = sequelize;
      const comments = await model.Comment.findAll({
        limit,
        where: { parentId: null },
        order: [["createdAt", "DESC"]],
        attributes: [[col("commentId"), "id"], "content", "createdAt", "chapterId"],
        include: [
          { model: model.User, attributes: ["username", "avatar"] },
          { model: model.Comic, attributes: ["title", "slug"] },
          { model: model.Chapter, attributes: ["title"], required: false },
        ],
      });
      return comments;
    },

    // GET /admin/comments
    async getAllCommentsAdmin({ page = 1, limit = 20 }) {
      const offset = (page - 1) * limit;
      const { count, rows } = await commentRepo.findAndCountAllAdmin({ limit, offset }, { model });

      // Tính likes & reports cho mỗi comment
      const formatted = [];
      for (const c of rows) {
        const plain = c.get({ plain: true });
        const [likes, reports] = await Promise.all([
          commentLikeRepo.countByComment(plain.commentId, { model }),
          reportRepo.countByComment(plain.commentId, { model }),
        ]);

        formatted.push({
          id: plain.commentId,
          content: plain.content,
          createdAt: plain.createdAt,
          likes: likes || 0,
          reports: reports || 0,
          mangaTitle: plain.Comic ? plain.Comic.title : "Không xác định",
          chapterNumber: null,
          user: {
            name: plain.User?.username || "Ẩn danh",
            email: plain.User?.email || "",
            avatar: plain.User?.avatar || null,
          },
        });
      }

      return {
        comments: formatted,
        meta: {
          page,
          limit,
          total: count,
          totalPages: Math.max(1, Math.ceil(count / limit)),
        },
      };
    },

    // DELETE /admin/comments/:id
    async deleteComment({ id }) {
      const comment = await commentRepo.findByPk(id, {
        model,
        include: [
          {
            model: model.User,
            attributes: ["userId", "username", "email"], // lấy các field cần
          },
        ],
      });
      if (!comment) throw new AppError("Không tìm thấy bình luận.", 404, "COMMENT_NOT_FOUND");
      const ownerId = comment.userId;
      const reason =  "Vi phạm quy định";
      await sequelize.transaction(async (t) => {
        // Xoá likes
        await commentLikeRepo.destroy({ commentId: id }, { model, transaction: t });

        // Xoá reply
        await commentRepo.destroy({ parentId: id }, { model, transaction: t });

        // Xoá comment chính
        await comment.destroy({ transaction: t });

        // Chỉ gửi thông báo sau khi COMMIT thành công
        t.afterCommit(async () => {
          await notificationService.createAndNotify({
            category: "comment",
            audienceType: "direct",
            userId: ownerId,
            title: "Bình luận đã bị xóa",
            message: `Bình luận của bạn (ID #${id}) đã bị xóa bởi quản trị viên.`,
            extra: { targetType: "comment", targetId: id, action: "delete", reason },
          });
        });
      });

      return { message: "Đã xóa bình luận và gửi thông báo cho người dùng." };
    },
  };
};
