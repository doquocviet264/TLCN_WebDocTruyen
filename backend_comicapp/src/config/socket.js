// src/config/socket.js
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const attachChatSocket = require("../sockets/chat.socket");

let ioInstance = null;

function initSocket(server) {
  const corsOrigin = process.env.CORS_ORIGIN || "*";

  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // 🔐 JWT middleware cho Socket.IO
  io.use((socket, next) => {
    try {
      const rawAuth = socket.handshake.headers?.authorization || "";
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (rawAuth.startsWith("Bearer ")
          ? rawAuth.replace(/^Bearer\s+/i, "")
          : null);

      if (!token) {
        console.warn("⚠️ Socket connection without token");
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.user?.userId;

      if (!userId) {
        console.error("❌ JWT payload không có user.userId:", decoded);
        return next(new Error("Unauthorized"));
      }

      socket.user = {
        userId,
        // nếu muốn, bạn có thể nhét cả decoded.user vào:
        ...decoded.user,
      };

      console.log("✅ Socket JWT OK, userId =", userId);
      next();
    } catch (err) {
      console.error("❌ JWT invalid in socket:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.user || {};
    if (userId) {
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      console.log(`✅ Socket connected: ${socket.id} (User ${userId})`);

      // Gắn handler chat (file chat.socket.js hiện tại của bạn)
      attachChatSocket(io, socket);
    } else {
      console.log(`⚠️ Socket connected without user: ${socket.id}`);
      // Nếu muốn chặt hơn thì:
      // socket.disconnect(true);
    }

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket ${socket.id} disconnected (${reason})`);
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO chưa được khởi tạo — gọi initSocket(server) trước");
  }
  return ioInstance;
}

function emitToUser(userId, event, data) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, data);
  console.log(`📢 Emit event "${event}" tới user:${userId}`);
}

module.exports = { initSocket, getIO, emitToUser };
