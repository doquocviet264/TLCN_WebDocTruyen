const AppError = require("../utils/AppError");

module.exports = ({ sequelize, model, postRepo, postLikeRepo, postCommentRepo }) => {
  const pickRatings = (p) => ({
    ratingStoryLine: p.ratingStoryLine ?? null,
    ratingCharacters: p.ratingCharacters ?? null,
    ratingArt: p.ratingArt ?? null,
    ratingEmotion: p.ratingEmotion ?? null,
    ratingCreativity: p.ratingCreativity ?? null,
  });

  const ensureReviewRatings = (type, ratings) => {
    if (type !== "review") return;
    for (const [k, v] of Object.entries(ratings)) {
      if (!(Number.isInteger(v) && v >= 1 && v <= 5)) {
        throw new AppError(`Điểm ${k} phải 1..5`, 400, "RATING_INVALID");
      }
    }
  };

  return {
    // ===== POSTS =====
    async createPost(userId, payload) {
      const t = await sequelize.transaction();
      try {
        const { type, title, content, comicId = null, genreIds = [], images = [] } = payload;

        const ratings = pickRatings(payload);
        ensureReviewRatings(type, ratings);

        const post = await postRepo.create(
          { userId, type, title, content, comicId, ...ratings },
          { model, transaction: t }
        );

        if (genreIds?.length) {
          await postRepo.bulkAttachGenres(post.postId, genreIds, { model, transaction: t });
        }
        if (images?.length) {
          await postRepo.bulkAddImages(post.postId, images, { model, transaction: t });
        }

        await t.commit();
        return await postRepo.findById(post.postId, { model });
      } catch (e) {
        await t.rollback();
        throw new AppError(e.message || "Tạo bài thất bại", 400, "CREATE_POST_FAILED");
      }
    },

    async listPosts(query, currentUserId = null) {
      const {
        q, type, userId, comicId, genreIds,
        genreMode = "any", minAvgRating, sort = "new",
        lastDays, start, end, page = 1, limit = 12,
      } = query;

      // time window cho "hot"
      let windowStart = null, windowEnd = null;
      if (lastDays) {
        const endDate = new Date();
        const startDate = new Date(Date.now() - Number(lastDays) * 86400000);
        windowStart = startDate.toISOString().slice(0, 19);
        windowEnd = endDate.toISOString().slice(0, 19);
      } else if (start && end) {
        windowStart = new Date(start).toISOString().slice(0, 19);
        windowEnd = new Date(end).toISOString().slice(0, 19);
      }

      const genreIdList = genreIds
        ? genreIds.split(",").map((x) => parseInt(x, 10)).filter((x) => Number.isInteger(x) && x > 0)
        : [];

      const { rows, count } = await postRepo.findAndCount(
        {
          kw: q,
          type,
          userId,
          comicId,
          currentUserId,
          genreIdList,
          genreMode,
          minAvgRating,
          sort,
          windowStart,
          windowEnd,
          page: Number(page) || 1,
          limit: Number(limit) || 12,
        },
        { model }
      );

      const total = Array.isArray(count) ? count.length : count;
      const limitNum = Number(limit) || 12;
      const pageNum = Number(page) || 1;
      const pages = Math.ceil(total / limitNum);

      return { rows, meta: { page: pageNum, limit: limitNum, total, pages, sort, genreMode, window: { start: windowStart, end: windowEnd } } };
    },

    async getPostById(postId, currentUserId = null) {
      const post = await postRepo.findById(postId, { model, currentUserId });
      if (!post) throw new AppError("Không tìm thấy bài đăng", 404, "NOT_FOUND");
      return post;
    },

    // ===== LIKES =====
    async likePost(userId, postId) {
      await postLikeRepo.like(userId, postId, { model });
      return { liked: true };
    },

    async unlikePost(userId, postId) {
      await postLikeRepo.unlike(userId, postId, { model });
      return { liked: false };
    },

    // ===== COMMENTS =====
    async createComment(userId, postId, { content, parentId = null }) {
      if (!content?.trim()) throw new AppError("Nội dung rỗng", 400, "EMPTY_CONTENT");
      const created = await postCommentRepo.create(
        { userId, postId, parentId, content: content.trim() },
        { model }
      );
      // ✅ Trả về comment kèm author, KHÔNG embed replies
      return postCommentRepo.findByPkWithAuthor(created.commentId, { model });
    },

    async getComments(postId, { page = 1, limit = 10 } = {}) {
      const limitNum = Number(limit) || 10;
      const pageNum = Number(page) || 1;
      const offset = (pageNum - 1) * limitNum;

      // ✅ chỉ ROOT comments + repliesCount
      const { rows, count } = await postCommentRepo.listRootsByPost(postId, {
        model,
        limit: limitNum,
        offset,
      });

      const total = typeof count === "number" ? count : (Array.isArray(count) ? count.length : 0);
      const pages = Math.ceil(total / limitNum) || 1;

      return { rows, meta: { page: pageNum, limit: limitNum, total, pages } };
    },

    async getCommentReplies(parentId, { page = 1, limit = 10 } = {}) {
      const limitNum = Number(limit) || 10;
      const pageNum = Number(page) || 1;
      const offset = (pageNum - 1) * limitNum;

      const { rows, count } = await postCommentRepo.listRepliesByParentId(parentId, {
        model,
        limit: limitNum,
        offset,
      });

      const total = typeof count === "number" ? count : (Array.isArray(count) ? count.length : 0);
      const pages = Math.ceil(total / limitNum) || 1;

      return { rows, meta: { page: pageNum, limit: limitNum, total, pages } };
    },
  };
};
