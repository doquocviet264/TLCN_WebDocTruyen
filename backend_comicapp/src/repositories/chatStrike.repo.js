// app/repositories/chatStrike.repo.js
const { Op } = require("sequelize");

module.exports = {
  /**
   * Thêm 1 strike mới
   */
  addStrike(
    { userId, channelId, messageId = null, score, reason, source = "AUTO_RULE", createdBy },
    { model, transaction } = {}
  ) {
    return model.ChatStrike.create(
      {
        userId,
        channelId,
        messageId,
        score,
        reason,
        source,
        createdBy,
      },
      { transaction }
    );
  },

  /**
   * Lấy các strike gần đây của user trong channel
   */
  getRecentStrikes({ userId, channelId, since }, { model } = {}) {
    return model.ChatStrike.findAll({
      where: {
        userId,
        channelId,
        createdAt: {
          [Op.gte]: since,
        },
      },
      include: [
        {
          model: model.User,
          as: "striker", // alias trong models
          attributes: ["userId", "username"],
        },
        {
          model: model.ChatMessage,
          as: "message",
          attributes: ["messageId", "content"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  },
};
