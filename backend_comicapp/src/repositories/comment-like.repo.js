// app/repositories/comment-like.repo.js
module.exports = {
  findOne(where = {}, { model, transaction } = {}) {
    return model.CommentLikes.findOne({ where, transaction });
  },
  create(data, { model, transaction } = {}) {
    return model.CommentLikes.create(data, { transaction });
  },
  destroy(where, { model, transaction } = {}) {
    return model.CommentLikes.destroy({ where, transaction });
  },
  findAllByUser(userId, { model } = {}) {
    return model.CommentLikes.findAll({ where: { userId }, attributes: ["commentId"] });
  },
  countByComment(commentId, { model } = {}) {
    return model.CommentLikes.count({ where: { commentId } });
  },
};
