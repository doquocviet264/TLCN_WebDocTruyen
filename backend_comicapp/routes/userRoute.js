const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getProfile, updateProfile, changePassword, uploadAvatar, getGoldDetails, performCheckIn } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// cấu hình multer (chỉ nhận ảnh)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 }, // tối đa 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ được upload ảnh'));
    }
    cb(null, true);
  }
});
// Middleware xác thực
router.use(protect);
// Lấy thông tin profile
router.get('/profile', getProfile);
// Cập nhật thông tin profile
router.put('/profile', updateProfile);
// Đổi mật khẩu
router.put('/password', changePassword);
// Upload avatar
router.post('/avatar', upload.single('avatar'), uploadAvatar);
// Lấy dữ liệu chi tiết (lịch sử giao dịch, điểm danh)
router.get('/gold-details', getGoldDetails);
// Thực hiện điểm danh
router.post('/checkin', performCheckIn);
module.exports = router;
