// src/sockets/chat.socket.js (hoặc app/sockets)

const { models } = require("../db");
const chatRepository = require("../repositories/chat.repo");
const chatStrikeRepository = require("../repositories/chatStrike.repo");
const chatMuteRepository = require("../repositories/chatMute.repo");
const moderationServiceFactory = require("../services/moderation.service");
const botServiceFactory = require("../services/bot.service");

const BOT_USER_ID = 99;

// Gom vào 1 object để truyền cho service
const repositories = {
  chatRepository,
  chatStrikeRepository,
  chatMuteRepository,
};

const moderationService = moderationServiceFactory(repositories, models, BOT_USER_ID);
const botService = botServiceFactory(repositories, models, BOT_USER_ID);

function attachChatSocket(io, socket) {
  // 📌 Handler gửi tin nhắn
const handleChatSend = async (payload) => {
  console.log("📩 [chat:send] from socket", socket.id, "payload =", payload);

  try {
    const user = socket.user;
    const userId = user?.userId;
    if (!userId) {
      return socket.emit("chat:error", {
        message: "Bạn cần đăng nhập để gửi tin nhắn.",
      });
    }

    const { channelId, content, replyToId } = payload || {};
    if (!channelId || typeof content !== "string") {
      return socket.emit("chat:error", {
        message: "Thiếu channelId hoặc nội dung tin nhắn.",
      });
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    // 1) Check mute
    const muteCheck = await moderationService.checkMute({ userId, channelId });
    if (muteCheck.isMuted) {
      await botService.notifyUserMuted({
        io,
        channelId,
        user,
        mute: muteCheck.mute,
      });
      socket.emit("chat:blocked", {
        channelId,
        reason: "MUTED",
        muteUntil: muteCheck.mute.mutedUntil,
      });
      return;
    }

    // 2) ĐÁNH GIÁ NỘI DUNG TRƯỚC
    const decision = await moderationService.evaluateMessage({
      user,
      channelId,
      content: trimmed,
    });

    // 👉 Nếu sau này bạn có action "BLOCK" thì có thể chặn luôn ở đây:
    // if (decision.action === "BLOCK") { ... return; }

    // 3) TẠO MESSAGE USER TRƯỚC
    const messageRow = await chatRepository.createMessage(
      {
        channelId,
        userId,
        content: trimmed,
        messageType: "USER",
        replyToId: replyToId || null,
      },
      { model: models }
    );

    const sender = await models.User.findByPk(userId, {
      attributes: ["userId", "username", "avatar"],
    });

    const dto = {
      messageId: messageRow.messageId,
      channelId: messageRow.channelId,
      content: messageRow.content,
      messageType: messageRow.messageType,
      replyToId: messageRow.replyToId,
      isDeleted: messageRow.isDeleted,
      deletedBy: null,
      isPinned: messageRow.isPinned,
      createdAt: messageRow.createdAt.toISOString(),
      sender: sender
        ? {
            userId: sender.userId,
            username: sender.username,
            avatar: sender.avatar,
          }
        : null,
    };

    // ✅ Broadcast tin nhắn USER trước
    io.to(`channel:${channelId}`).emit("chat:message", dto);

    // 4) SAU ĐÓ mới xử lý cảnh báo / strike / mute
    if (decision.action === "WARN") {
      // ghi strike có gắn messageId luôn cho đẹp
      await moderationService.addStrike({
        userId,
        channelId,
        messageId: messageRow.messageId,
        score: 1,
        reason: decision.reason,
        source: "AUTO_RULE",
        createdBy: BOT_USER_ID,
      });

      // bot cảnh báo
      await botService.warnUserInChannel({
        io,
        channelId,
        username: sender.username,
        reason: decision.reason,
      });

      // kiểm tra escalte mute
      const escalation = await moderationService.shouldEscalateToMute({
        userId,
        channelId,
      });

      if (escalation?.shouldMute) {
        const now = new Date();
        const endOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );

        const mute = await moderationService.createMute({
          userId,
          channelId,
          mutedUntil: endOfDay,
          reason: "TOO_MANY_VIOLATIONS",
          createdBy: BOT_USER_ID,
        });

        await botService.notifyUserMuted({
          io,
          channelId,
          user,
          mute,
        });

        socket.emit("chat:blocked", {
          channelId,
          reason: "MUTED_DUE_TO_STRIKES",
          muteUntil: mute.mutedUntil,
        });
      }
    }
  } catch (err) {
    console.error("❌ Error in handleChatSend:", err);
    socket.emit("chat:error", {
      message: "Gửi tin nhắn thất bại",
      error: err.message,
    });
  }
};


  const handleJoin = ({ channelId }) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    socket.join(roomName);
    console.log(`👤 User ${socket.user.userId} joined ${roomName}`);
  };

  const handleLeave = ({ channelId }) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    socket.leave(roomName);
    console.log(`👤 User ${socket.user.userId} left ${roomName}`);
  };

  socket.on("chat:send", handleChatSend);
  socket.on("chat:join", handleJoin);
  socket.on("chat:leave", handleLeave);
}

module.exports = attachChatSocket;
