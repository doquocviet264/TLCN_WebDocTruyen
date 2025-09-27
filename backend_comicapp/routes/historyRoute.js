const express = require('express');
const router = express.Router();
const { updateReadingHistory, getReadingHistory, clearReadingHistory, deleteReadingHistoryByComic } = require('../controllers/historyController.js');
const { protect } = require('../middleware/authMiddleware.js'); // Yêu cầu đăng nhập

// Endpoint để cập nhật/tạo lịch sử đọc
router.post('/update', protect, updateReadingHistory);
// Endpoint để lấy lịch sử đọc của người dùng
router.get('/', protect, getReadingHistory);
// Endpoint để xoá toàn bộ lịch sử đọc của người dùng
router.delete('/clear', protect, clearReadingHistory);
// Endpoint để xoá lịch sử đọc của 1 truyện cụ thể
router.delete('/:comicId', protect, deleteReadingHistoryByComic);
module.exports = router;