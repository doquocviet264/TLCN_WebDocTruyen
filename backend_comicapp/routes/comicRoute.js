const express = require('express');
const router = express.Router();
const {getHomepageSections, getComicDetails, toggleFollow, getNewlyUpdatedComics, getFeaturedComics, getRankings, getComicDetailForHistory} = require('../controllers/comicController.js');
const { protect, optionalAuth } = require('../middleware/authMiddleware.js');



// lấy danh sách truyện cho trang home
router.get('/homepage-sections', getHomepageSections);
// lấy dữ liệu cho bảng
router.get('/rankings', getRankings);
// lấy truyện đề cử
router.get('/featured', getFeaturedComics);
// lấy truyện mới cập nhật
router.get('/newly-updated', getNewlyUpdatedComics);
//  Lấy chi tiết truyện, không cần đăng nhập nhưng nếu có sẽ check follow
router.get('/:slug', optionalAuth, getComicDetails);
//  Theo dõi/bỏ theo dõi, yêu cầu đăng nhập
router.post('/:slug/follow', protect, toggleFollow);


// lấy thông tin truyện từ id
router.get('/id/:comicId', getComicDetailForHistory);


module.exports = router;