const express = require('express');
const router = express.Router();
const { getCommentsByComic, createComment, toggleLikeComment, getRecentComments } = require('../controllers/commentController.js');
const { protect, optionalAuth } = require('../middleware/authMiddleware.js');

// lấy các bình luận mới nhất
router.get('/recent', getRecentComments);
// Lấy comments của một truyện (có thể xem khi chưa đăng nhập)
router.get('/comic/:slug', optionalAuth, getCommentsByComic);

// Tạo một comment mới (yêu cầu đăng nhập)
router.post('/', protect, createComment);

// Like/unlike một comment (yêu cầu đăng nhập)
router.post('/:commentId/like', protect, toggleLikeComment);

module.exports = router;