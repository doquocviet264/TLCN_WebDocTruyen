const { User, Comic, Comment, ComicFollow, Chapter } = require('../models');
const cloudinary = require('../config/cloudinary');
const fs = require('fs/promises');

// Lấy thông tin profile người dùng
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetExpiration'] },
    });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng 2' });

    const totalRead = await Chapter.count({
      include: [{
        model: Comic,
        include: [{
          model: User,
          as: 'Followers',
          where: { userId },
          required: true,
        }],
      }],
    });

    const favorites = await ComicFollow.count({ where: { userId } });
    const comments = await Comment.count({ where: { userId } });

    res.json({
      ...(user.getProfileInfo ? user.getProfileInfo() : user.toJSON()),
      totalRead,
      favorites,
      comments,
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Cập nhật thông tin người dùng
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, gender, birthday } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (username) user.username = username;
    if (gender) user.gender = gender;
    if (birthday) user.birthday = birthday;

    await user.save();

    res.json({
      message: 'Cập nhật thông tin cá nhân thành công',
      user: user.getProfileInfo ? user.getProfileInfo() : user.toJSON(),
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu dữ liệu' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const isValidPassword = await user.validPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Thay đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi khi thay đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!req.file) return res.status(400).json({ message: 'Không có file upload' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill' },
        { quality: 'auto' },
        { format: 'auto' },
      ],
    });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.avatar = result.secure_url;
    await user.save();

    // Xoá file tạm
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn('Không thể xoá file tạm:', err.message);
    }

    res.json({
      message: 'Cập nhật avater thành công',
      user: user.getProfileInfo ? user.getProfileInfo() : user.toJSON(),
    });
  } catch (error) {
    console.error('Lỗi khi upload avater', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, uploadAvatar };
