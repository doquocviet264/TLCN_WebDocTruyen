// Post Like Repository - DI: { model } bắt buộc

module.exports = {
  async like(userId, postId, { model, transaction } = {}) {
    return model.PostLike.findOrCreate({
      where: { userId, postId },
      defaults: { userId, postId },
      transaction,
    });
  },

  async unlike(userId, postId, { model, transaction } = {}) {
    return model.PostLike.destroy({ where: { userId, postId }, transaction });
  },
};
