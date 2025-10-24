// app/middlewares/auth.js
const jwt = require("jsonwebtoken");
const { models } = require("../db");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.user.userId;
      const user = await models.User.findByPk(userId, { attributes: { exclude: ["password"] } });
      if (!user) return res.status(401).json({ message: "Không tìm thấy người dùng" });

      req.user = user;
      return next();
    } catch (e) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  return res.status(401).json({ message: "Không có token" });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ message: "Bạn không có quyền admin" });
};

const optionalAuth = async (req, res, next) => {
  req.user = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await models.User.findByPk(decoded.user.userId, { attributes: { exclude: ["password"] } });
    } catch (e) {
      // ignore
    }
  }
  next();
};

module.exports = { protect, optionalAuth, isAdmin };
