const express = require('express');
const router = express.Router();
const { updateReadingHistory, getReadingHistory, clearReadingHistory } = require('../controllers/historyController.js');
const { protect } = require('../middleware/authMiddleware.js'); // Yêu cầu đăng nhập

// Endpoint để cập nhật/tạo lịch sử đọc
router.post('/update', protect, updateReadingHistory);
router.get('/', protect, getReadingHistory);
router.delete('/clear', protect, clearReadingHistory);
module.exports = router;