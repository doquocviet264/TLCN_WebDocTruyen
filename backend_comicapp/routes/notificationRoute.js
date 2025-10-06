const express = require('express');
const router = express.Router();
const {getNotifications, markAsRead, maskAllAsRead} = require('../controllers/notificationController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Lấy thông báo của người dùng
router.get('/', protect, getNotifications);
// Đánh dấu một thông báo đã đọc
router.put('/:notificationId/read', protect, markAsRead);
// Đánh dấu tất cả thông báo đã đọc
router.put('/read-all', protect, maskAllAsRead);

module.exports = router;