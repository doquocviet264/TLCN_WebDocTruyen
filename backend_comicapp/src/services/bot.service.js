// app/services/bot.service.js

module.exports = (repositories, models, BOT_USER_ID) => {
  const { ChatMessage, User } = models;

  const api = {
    /**
     * Gửi 1 tin nhắn BOT vào channel + broadcast tới room channel
     */
    sendBotMessageToChannel: async ({ io, channelId, content, meta }) => {
      if (!io || !channelId || !content || !BOT_USER_ID) {
        console.error(
          "sendBotMessageToChannel: Missing io/channelId/content/BOT_USER_ID"
        );
        return null;
      }

      try {
        const createdMessage = await ChatMessage.create({
          channelId,
          userId: BOT_USER_ID,
          content,
          messageType: "BOT",
          replyToId: null,
          isDeleted: 0,
          deletedBy: null,
          deletedReason: null,
          isPinned: 0,
          metaJson: meta || null,
        });

        const sender =
          (await User.findByPk(BOT_USER_ID, {
            attributes: ["userId", "username", "avatar"],
          })) || null;

        const dto = {
          messageId: createdMessage.messageId,
          channelId: createdMessage.channelId,
          content: createdMessage.content,
          messageType: createdMessage.messageType,
          replyToId: createdMessage.replyToId,
          isDeleted: !!createdMessage.isDeleted,
          deletedBy: null,
          isPinned: !!createdMessage.isPinned,
          createdAt: createdMessage.createdAt
            ? createdMessage.createdAt.toISOString()
            : new Date().toISOString(),
          sender: sender
            ? {
                userId: sender.userId,
                username: sender.username,
                avatar: sender.avatar,
              }
            : { userId: BOT_USER_ID, username: "ChatGuard", avatar: null },
        };

        io.to(`channel:${channelId}`).emit("chat:message", dto);
        console.log(`BOT message sent to channel ${channelId}: "${content}"`);
        return dto;
      } catch (error) {
        console.error(
          `Error sending BOT message to channel ${channelId}:`,
          error
        );
        return null;
      }
    },

    /**
     * BOT thông báo user đã bị mute tới thời điểm nào
     */
    notifyUserMuted: async ({ io, channelId, user, mute }) => {
      if (!io || !channelId || !user || !mute) {
        console.error("notifyUserMuted: Missing parameters");
        return;
      }

      const muteEndTime = new Date(mute.mutedUntil);
      const formattedMuteUntil = muteEndTime.toLocaleString();

      const content = `@${user.username} bạn đã bị mute đến ${formattedMuteUntil}. Lý do: ${mute.reason}`;

      await api.sendBotMessageToChannel({ io, channelId, content });
    },

    /**
     * BOT báo 1 tin nhắn bị chặn + phát thông báo trong kênh (tuỳ chọn)
     */
    notifyMessageBlocked: async ({ socket, io, channelId, reason }) => {
      if (!socket || !channelId || !reason) {
        console.error("notifyMessageBlocked: Missing parameters");
        return;
      }

      socket.emit("chat:blocked", { channelId, reason });
      console.log(
        `BOT notification: Message blocked for user ${socket.user.userId} in channel ${channelId} due to ${reason}`
      );

      if (io) {
        await api.sendBotMessageToChannel({
          io,
          channelId,
          content: "Một tin nhắn đã bị chặn do vi phạm nội quy.",
        });
      }
    },

    /**
     * BOT cảnh báo user trong kênh khi vi phạm (nhưng vẫn cho gửi message)
     */
    warnUserInChannel: async ({ io, channelId, username, reason }) => {
      if (!io || !channelId || !username || !reason) {
        console.error("warnUserInChannel: Missing parameters");
        return;
      }

      const content = `@${username} vui lòng hạn chế từ ngữ nhạy cảm. (${reason})`;
      await api.sendBotMessageToChannel({ io, channelId, content });
    },
  };

  return api;
};
