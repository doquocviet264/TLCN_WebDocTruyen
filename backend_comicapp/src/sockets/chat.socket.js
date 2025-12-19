// app/sockets/chat.socket.js
const { models } = require("../db");
const moderationServiceFactory = require("../services/moderation.service");
const axios = require("axios");
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000";

// Map lưu trạng thái online: channelId -> Map<userId, connectionCount>
const channelOnlineMap = new Map();

// Service
const moderationService = moderationServiceFactory(models);

function attachChatSocket(io, socket) {
  // Track các channel mà socket này đang join
  socket.joinedChannels = new Set();

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

  };
  const handleChatbotAsk = async (payload) => {
  try {
    const user = socket.user;
    console.log(user)
    const userId = user?.userId;
    if (!userId) {
      return socket.emit("chatbot:error", { message: "Bạn cần đăng nhập để dùng chatbot." });
    }

    const content = (payload?.content ?? "").toString().trim();
    const context = payload?.context || {};
    const personaId = payload?.personaId || "3"; // default GenZ (tuỳ bạn)
    const rawHistory = Array.isArray(payload?.history) ? payload.history : [];
    const history = rawHistory
      .slice(-10)
      .map((m) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: (m?.content ?? "").toString().slice(0, 800),
      }))
      .filter((m) => m.content.trim().length > 0);

    if (!content) return;

    // (Optional) moderation giống chat thường
    const decision = await moderationService.evaluateMessage({
      user,
      channelId: null,
      content,
    });
    if (decision.action === "BLOCK") {
      return socket.emit("chatbot:blocked", {
        reason: "BANNED_KEYWORD",
        detail: decision.reason,
      });
    }

    // 1) Echo lại message user cho UI (để hiện ngay)
    socket.emit("chatbot:message", {
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    });

    // 2) Gọi FastAPI /chat
    const apiRes = await axios.post(
      `${FASTAPI_BASE_URL}/chat`,
      {
        message: content,
        personaId,
        context: {
          page: context.page || "home",
          comicSlug: context.comicSlug || null,
          chapterId: context.chapterId || null,
        },
        history,
      },
      { timeout: 60000 }
    );

    const data = apiRes.data || {};
    console.log(data)
    // 3) Emit lại cho FE
    socket.emit("chatbot:reply", {
      role: "assistant",
      content: data.reply || "Mình chưa thể trả lời lúc này.",
      intent: data.intent || null,
      results: Array.isArray(data.results) ? data.results : [],
      actions: Array.isArray(data.actions) ? data.actions : [],
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ chatbot:ask error:", err?.response?.data || err.message);
    socket.emit("chatbot:error", {
      message: "Chatbot xử lý thất bại.",
      error: err?.response?.data || err.message,
    });
  }
};

  // ===================== socket events =====================
  socket.on("chat:send", handleChatSend);
  socket.on("chat:join", handleJoin);
  socket.on("chat:leave", handleLeave);
  socket.on("chatbot:ask", handleChatbotAsk);

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
