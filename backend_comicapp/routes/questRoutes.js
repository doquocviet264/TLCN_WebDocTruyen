const express = require('express');
const router = express.Router();
const questController = require('../controllers/questController');
const {protect} = require('../middleware/authMiddleware');

// Tất cả routes cần authentication
router.use(protect);

// Lấy danh sách quests hàng ngày
router.get('/daily', questController.getDailyQuests);

// Nhận thưởng quest
router.post('/:userQuestId/claim', questController.claimQuestReward);

// Cập nhật tiến độ quest (test API)
router.put('/progress', questController.updateQuestProgress);

module.exports = router;