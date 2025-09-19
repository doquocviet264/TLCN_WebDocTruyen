const express = require("express");
const router = express.Router();
const { unlockChapter,  checkChapterUnlockStatus, getChapterDetails,} = require("../controllers/chapterController");
const { protect, optionalAuth } = require('../middleware/authMiddleware');
//mở khoá chương truyện
router.post("/:chapterId/unlock", protect, unlockChapter);
//kiểm tra xem đã mở khoá chưa
router.get("/:chapterId/check-unlock", optionalAuth, checkChapterUnlockStatus);
// Lấy chi tiết chương truyện
router.get('/:slug/:chapterNumber', optionalAuth, getChapterDetails);//bỏ sang chapter
module.exports = router;
