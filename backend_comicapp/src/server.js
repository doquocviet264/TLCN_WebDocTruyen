// src/server.js
require("dotenv/config");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { initDb } = require("./db/index");
const routes = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const { initSocket } = require("./config/socket");
// Swagger
const { setupOpenAPI } = require("./docs/openapi");

const app = express();
app.use(cors());
app.use(express.json());

// Swagger (/docs, /openapi.json)
setupOpenAPI(app);

// API routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

// Start server after DB init
const PORT = process.env.PORT || 3000;
// Tạo HTTP server từ app (QUAN TRỌNG cho socket.io)
const server = http.createServer(app);
// Khởi tạo Socket.IO, truyền server vào đây
initSocket(server, { corsOrigin: process.env.CORS_ORIGIN || "*" });
initDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📘 Swagger Docs: http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  });

