// src/repositories/chatMute.repo.js
const { Op } = require("sequelize");

module.exports = {
  /**
   * Lấy mute đang còn hiệu lực
   */
  getActiveMute({ userId, channelId }, { model } = {}) {
    if (!model) {
      console.error("❌ chatMute.repo.getActiveMute: missing model");
      throw new Error("chatMute.repo.getActiveMute called without model");
    }

    return model.ChatMute.findOne({
      where: {
        userId,
        channelId,
        mutedUntil: { [Op.gt]: new Date() },
      },
      order: [["mutedUntil", "DESC"]],
    }).then((mute) => ({
      isMuted: !!mute,
      mute,
    }));
  },

  /**
   * Tạo mute
   */
  createMute(
    { userId, channelId, mutedUntil, reason, createdBy },
    { model, transaction } = {}
  ) {
    if (!model) {
      console.error("❌ chatMute.repo.createMute: missing model");
      throw new Error("chatMute.repo.createMute called without model");
    }

    return model.ChatMute.create(
      {
        userId,
        channelId,
        mutedUntil,
        reason,
        createdBy,
      },
      { transaction }
    );
  },

  /**
   * Lấy tất cả mute
   */
  findUserMutes({ userId, channelId }, { model } = {}) {
    if (!model) {
      console.error("❌ chatMute.repo.findUserMutes: missing model");
      throw new Error("chatMute.repo.findUserMutes called without model");
    }

    return model.ChatMute.findAll({
      where: { userId, channelId },
      include: [
        {
          model: model.User,
          as: "muter",
          attributes: ["userId", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  },
};
