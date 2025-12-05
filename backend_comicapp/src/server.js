// src/server.js
require("dotenv/config");
const express = require("express");
const cors = require("cors");
const http = require("http");

const { initDb } = require("./db"); // hoặc "./db/index" tuỳ bạn
const routes = require("./routes"); // hoặc "./routes/index"
const errorHandler = require("./middlewares/errorHandler");
const { initSocket } = require("./config/socket");
const { setupOpenAPI } = require("./docs/openapi");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


setupOpenAPI(app);

app.use("/api", routes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

initDb()
  .then(() => {
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📘 Swagger Docs: http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err);
    process.exit(1);
  });
