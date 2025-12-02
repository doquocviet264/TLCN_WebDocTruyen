// app/sockets/chat.socket.js
const { models } = require("../db");
const moderationServiceFactory = require("../services/moderation.service");

// Map lưu trạng thái online: channelId -> Map<userId, connectionCount>
const channelOnlineMap = new Map();

// Service
const moderationService = moderationServiceFactory(models);

function attachChatSocket(io, socket) {
  // Track các channel mà socket này đang join
  socket.joinedChannels = new Set();

  // ===================== helper =====================
  function emitOnlineUsers(channelId) {
    const roomMap = channelOnlineMap.get(channelId);
    const userIds = roomMap ? Array.from(roomMap.keys()) : [];
    io.to(`channel:${channelId}`).emit("chat:onlineUsers", {
      channelId,
      userIds,
    });
  }

  function addOnlineUser(channelId, userId) {
    let roomMap = channelOnlineMap.get(channelId);
    if (!roomMap) {
      roomMap = new Map();
      channelOnlineMap.set(channelId, roomMap);
    }
    const prev = roomMap.get(userId) || 0;
    roomMap.set(userId, prev + 1);
    emitOnlineUsers(channelId);
  }

  function removeOnlineUser(channelId, userId) {
    const roomMap = channelOnlineMap.get(channelId);
    if (!roomMap) return;
    const prev = roomMap.get(userId) || 0;
    if (prev <= 1) {
      roomMap.delete(userId);
    } else {
      roomMap.set(userId, prev - 1);
    }
    emitOnlineUsers(channelId);
  }

  // ===================== chat:send =====================
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

      // 1) Lấy thông tin channel
      const channel = await models.ChatChannel.findByPk(channelId);
      if (!channel || !channel.isActive) {
        return socket.emit("chat:error", {
          message: "Không tìm thấy kênh chat.",
        });
      }

      // 2) Evaluate nội dung (check từ khóa cấm)
      const decision = await moderationService.evaluateMessage({
        user,
        channelId,
        content: trimmed,
      });

      // 👉 Nếu chứa từ cấm => KHÔNG lưu message, KHÔNG emit cho kênh
      if (decision.action === "BLOCK") {
        socket.emit("chat:blocked", {
          channelId,
          reason: "BANNED_KEYWORD",
          detail: decision.reason, // "OFFENSIVE_LANGUAGE"
        });
        return;
      }

      // 3) Tạo message bình thường
      const messageRow = await models.ChatMessage.create({
        channelId,
        userId,
        content: trimmed,
        replyToId: replyToId || null,
      });

      const sender = await models.User.findByPk(userId, {
        attributes: ["userId", "username", "avatar"],
      });

      const dto = {
        messageId: messageRow.messageId,
        channelId: messageRow.channelId,
        content: messageRow.content,
        replyToId: messageRow.replyToId,
        isPinned: !!messageRow.isPinned,
        createdAt: messageRow.createdAt.toISOString(),
        sender: sender
          ? {
              userId: sender.userId,
              username: sender.username,
              avatar: sender.avatar,
            }
          : null,
      };

      // 4) Gửi cho tất cả user trong kênh
      io.to(`channel:${channelId}`).emit("chat:message", dto);
    } catch (err) {
      console.error("❌ Error in handleChatSend:", err);
      socket.emit("chat:error", {
        message: "Gửi tin nhắn thất bại",
        error: err.message,
      });
    }
  };

  // ===================== JOIN / LEAVE =====================
  const handleJoin = ({ channelId }) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;

    socket.join(roomName);
    socket.joinedChannels.add(channelId);

    const userId = socket.user?.userId;
    if (userId) {
      addOnlineUser(channelId, userId);
    }

    console.log(`👤 User ${socket.user?.userId} joined ${roomName}`);
  };

  const handleLeave = ({ channelId }) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;

    socket.leave(roomName);
    socket.joinedChannels.delete(channelId);

    const userId = socket.user?.userId;
    if (userId) {
      removeOnlineUser(channelId, userId);
    }

    console.log(`👤 User ${socket.user?.userId} left ${roomName}`);
  };

  // ===================== socket events =====================
  socket.on("chat:send", handleChatSend);
  socket.on("chat:join", handleJoin);
  socket.on("chat:leave", handleLeave);

  socket.on("disconnect", () => {
    const userId = socket.user?.userId;
    if (!userId) return;

    // Khi disconnect, remove khỏi tất cả channel mà socket đã join
    for (const channelId of socket.joinedChannels) {
      removeOnlineUser(channelId, userId);
    }
  });
}

module.exports = attachChatSocket;
