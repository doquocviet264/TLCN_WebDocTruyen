const express = require('express');
const router = express.Router();
const { getUserRating, createOrUpdateRating } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

// Lấy đánh giá hiện tại của người dùng
router.get('/:comicId/user', protect, getUserRating);

// Gửi hoặc cập nhật đánh giá
router.post('/', protect, createOrUpdateRating);

module.exports = router;