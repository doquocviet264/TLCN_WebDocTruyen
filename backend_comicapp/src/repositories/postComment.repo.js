// Post Comment Repository - DI: { model } bắt buộc

module.exports = {
  async create(data, { model, transaction } = {}) {
    return model.PostComment.create(data, { transaction });
  },

  // 🔁 Sau khi create, lấy lại 1 comment (kèm author), KHÔNG embed replies
  async findByPkWithAuthor(commentId, { model } = {}) {
    return model.PostComment.findByPk(commentId, {
      include: [{ model: model.User, as: "author", attributes: ["userId", "username", "avatar"] }],
    });
  },

  // 🆕 Chỉ lấy ROOT comments của post (parentId = null) + repliesCount + phân trang + count
  async listRootsByPost(postId, { model, limit = 10, offset = 0 } = {}) {
    const { Sequelize } = model.Sequelize;
    return model.PostComment.findAndCountAll({
      where: { postId, parentId: null },       // <<< CHỈ ROOT
      attributes: {
        include: [
          [
            Sequelize.literal(
              `(SELECT COUNT(*) FROM postcomments c2 WHERE c2.parentId = PostComment.commentId)`
            ),
            "repliesCount",
          ],
        ],
      },
      include: [{ model: model.User, as: "author", attributes: ["userId", "username", "avatar"] }],
      order: [["createdAt", "DESC"]],
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
    });
  },

  // (Giữ lại nếu bạn còn dùng ở nơi khác)
  async findThread(commentId, { model } = {}) {
    return model.PostComment.findByPk(commentId, {
      include: [
        { model: model.User, as: "author", attributes: ["userId", "username", "avatar"] },
        {
          model: model.PostComment,
          as: "replies",
          include: [{ model: model.User, as: "author", attributes: ["userId", "username", "avatar"] }],
        },
      ],
    });
  },

  // 🔁 Replies cho 1 parentId + phân trang + count
  async listRepliesByParentId(parentId, { model, limit = 10, offset = 0 } = {}) {
    return model.PostComment.findAndCountAll({
      where: { parentId },
      include: [{ model: model.User, as: "author", attributes: ["userId", "username", "avatar"] }],
      order: [["createdAt", "ASC"]],
      limit: Number(limit) || 10,
      offset: Number(offset) || 0,
    });
  },
};
