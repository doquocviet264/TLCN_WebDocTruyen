const express = require('express');
const router = express.Router();
const { getComicDetails, toggleFollow } = require('../controllers/comicController.js');
const { protect, optionalAuth } = require('../middleware/authMiddleware.js');

//  Lấy chi tiết truyện, không cần đăng nhập nhưng nếu có sẽ check follow
router.get('/:slug', optionalAuth, getComicDetails);

//  Theo dõi/bỏ theo dõi, yêu cầu đăng nhập
router.post('/:slug/follow', protect, toggleFollow);

module.exports = router;