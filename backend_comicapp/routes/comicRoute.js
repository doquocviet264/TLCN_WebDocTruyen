const express = require('express');
const router = express.Router();
const {getHomepageSections, getComicDetails, toggleFollow, getNewlyUpdatedComics, getFeaturedComics, getRankings, getComicDetailForHistory, searchComics, getFollowedComics, getRelatedComics} = require('../controllers/comicController.js');
const { protect, optionalAuth } = require('../middleware/authMiddleware.js');

router.get('/search', searchComics);
// lấy danh sách truyện cho trang home
router.get('/homepage-sections', getHomepageSections);
// lấy danh sách truyện cho trang home
router.get('/followed', protect, getFollowedComics);
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
//  Theo dõi/bỏ theo dõi, yêu cầu đăng nhập
router.get('/:slug/related', getRelatedComics);
// lấy thông tin truyện từ id
router.get('/id/:comicId', getComicDetailForHistory);


module.exports = router;