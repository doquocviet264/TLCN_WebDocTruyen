// app/services/chat.service.js
const AppError = require("../utils/AppError");

module.exports = ({ sequelize, model, repos }) => {
  const { chatRepo } = repos;

  return {
    /**
     * GET /api/chat/channels
     * Lấy danh sách tất cả kênh chat đang hoạt động
     */
    async getAllChannels() {
      const channels = await chatRepo.findAllActiveChannels({ model });

      return channels.map((channel) => ({
        channelId: channel.channelId,
        name: channel.name,
        slug: channel.slug,
        type: channel.type,
        isActive: channel.isActive,
        createdAt: channel.createdAt,
      }));
    },

    /**
     * Lấy messages của 1 channel cho user (có phân trang)
     */
    async getChannelMessagesForUser({ userId, channelId, beforeId, limit }) {
      // Nếu cần check quyền / exist channel thì dùng thêm:
      // const channel = await chatRepo.findChannelById(channelId, { model });
      // if (!channel) throw new AppError("Kênh chat không tồn tại", 404, "CHANNEL_NOT_FOUND");

      const messages = await chatRepo.getChannelMessages(
        { channelId, beforeId, limit },
        { model }
      );

      return messages.map((message) => ({
        messageId: message.messageId,
        channelId: message.channelId,
        content: message.content,
        messageType: message.messageType,
        replyToId: message.replyToId,
        isDeleted: message.isDeleted,
        deletedBy: message.deleter
          ? {
              userId: message.deleter.userId,
              username: message.deleter.username,
            }
          : null,
        isPinned: message.isPinned,
        createdAt: message.createdAt?.toISOString?.() || message.createdAt,
        sender: message.sender
          ? {
              userId: message.sender.userId,
              username: message.sender.username,
              avatar: message.sender.avatar,
            }
          : null,
      }));
    },

    /**
     * Tạo message mới trong channel
     */
    async createMessage({ channelId, userId, content, messageType, replyToId }) {
      if (!content?.trim()) {
        throw new AppError("Nội dung tin nhắn rỗng", 400, "EMPTY_MESSAGE");
      }

      const created = await chatRepo.createMessage(
        {
          channelId,
          userId,
          content: content.trim(),
          messageType: messageType || "USER",
          replyToId: replyToId ?? null,
        },
        { model }
      );

      const sender = await model.User.findByPk(userId, {
        attributes: ["userId", "username", "avatar"],
      });

      return {
        messageId: created.messageId,
        channelId: created.channelId,
        content: created.content,
        messageType: created.messageType,
        replyToId: created.replyToId,
        isDeleted: created.isDeleted,
        deletedBy: null,
        isPinned: created.isPinned,
        createdAt: created.createdAt?.toISOString?.() || created.createdAt,
        sender: sender
          ? {
              userId: sender.userId,
              username: sender.username,
              avatar: sender.avatar,
            }
          : null,
      };
    },

    /**
     * Đánh dấu đã đọc (placeholder, sau này gắn repo khác)
     */
    async markAsRead({ userId, channelId, lastReadMessageId }) {
      // TODO: implement thực tế với bảng chatUserChannelState
      console.log(
        `Mark as read: user=${userId}, channel=${channelId}, lastRead=${lastReadMessageId}`
      );
      return { success: true };
    },
  };
};
