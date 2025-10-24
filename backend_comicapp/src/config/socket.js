// src/config/socket.js
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

let ioInstance = null;

/**
 * Khởi tạo Socket.IO server
 * @param {http.Server} server - HTTP server được tạo từ express (http.createServer(app))
 * @param {{ corsOrigin?: string }} options
 */
function initSocket(server, { corsOrigin = "*" } = {}) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"], // fallback khi WS lỗi
  });

  // ✅ Middleware xác thực JWT (nếu cần)
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        console.warn("⚠️ Không có token khi kết nối socket");
        return next(new Error("Unauthorized"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { userId: payload.userId };
      next();
    } catch (err) {
      console.error("❌ JWT invalid:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  // ✅ Lắng nghe kết nối
  io.on("connection", (socket) => {
    const { userId } = socket.user || {};
    if (userId) {
      const room = `user:${userId}`;
      socket.join(room);
      console.log(`✅ Socket connected: ${socket.id} (User ${userId})`);
    } else {
      console.log(`⚠️ Socket connected (no user) ${socket.id}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket ${socket.id} disconnected (${reason})`);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Lấy instance io hiện tại
 */
function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO chưa được khởi tạo — gọi initSocket(server) trước");
  }
  return ioInstance;
}

/**
 * Gửi sự kiện tới user cụ thể
 */
function emitToUser(userId, event, data) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, data);
  console.log(`📢 Emit event "${event}" tới user:${userId}`);
}

module.exports = { initSocket, getIO, emitToUser };
