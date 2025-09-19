const jwt = require('jsonwebtoken');
const { User } = require("../models/index");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Gắn thông tin user vào request, bỏ qua password
      const userId = decoded.user.userId;
      req.user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });

      if (!req.user) {
        return res.status(401).json({ message: "Không tìm thấy người dùng" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Không có token" });
  }
};

// Middleware tùy chọn, nếu có token thì xác thực, không có thì bỏ qua
const optionalAuth = async (req, res, next) => {
  req.user = null; // mặc định

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Token payload có dạng { user: { userId: ... } }
      req.user = await User.findByPk(decoded.user.userId, { attributes: { exclude: ['password'] } });
    } catch (error) {
      // Token sai hoặc hết hạn → req.user vẫn null
      console.log("Token không hợp lệ:", error.message);
    }
  }

  next();
};


module.exports = { protect, optionalAuth };