// app/repositories/chat.repo.js
module.exports = {
  // Lấy tất cả channel đang active
  findAllActiveChannels({ model, transaction } = {}) {
    return model.ChatChannel.findAll({
      where: { isActive: true },
      order: [["createdAt", "ASC"]],
      transaction,
    });
  },

  // Tìm channel theo id (nếu cần dùng)
  findChannelById(channelId, { model, transaction } = {}) {
    return model.ChatChannel.findByPk(channelId, { transaction });
  },

  // Lấy messages của 1 channel, có beforeId + limit
  getChannelMessages({ channelId, beforeId, limit = 20 }, { model, transaction } = {}) {
    const { Op } = model.Sequelize;

    const where = { channelId };
    if (beforeId) {
      where.messageId = { [Op.lt]: beforeId };
    }

    return model.ChatMessage.findAll({
      where,
      include: [
        {
          model: model.User,
          as: "sender",
          attributes: ["userId", "username", "avatar"],
        },
        {
          model: model.User,
          as: "deleter",
          required: false,
          attributes: ["userId", "username"],
        },
      ],
      order: [["messageId", "DESC"]],
      limit,
      transaction,
    });
  },

  // Tạo message mới
  createMessage(data, { model, transaction } = {}) {
    return model.ChatMessage.create(
      {
        channelId: data.channelId,
        userId: data.userId,
        content: data.content,
        messageType: data.messageType || "USER",
        replyToId: data.replyToId ?? null,
      },
      { transaction }
    );
  },
};
