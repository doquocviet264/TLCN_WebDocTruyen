const { ComicRating, Comic } = require('../models/index');

// Lấy đánh giá hiện tại của người dùng cho một comic
const getUserRating = async (req, res) => {
  try {
    const { comicId } = req.params;
    const userId = req.user.userId;

    const rating = await ComicRating.findOne({
      where: { comicId, userId },
      attributes: ['score'],
    });

    res.status(200).json({ rating: rating ? rating.score : null });
  } catch (error) {
    console.error('Lỗi khi lấy đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
  }
};

// Gửi hoặc cập nhật đánh giá
const createOrUpdateRating = async (req, res) => {
  try {
    const { comicId, rating } = req.body;
    const userId = req.user.userId;

    // Kiểm tra comic tồn tại
    const comic = await Comic.findByPk(comicId);
    if (!comic) {
      return res.status(404).json({ message: 'Không tìm thấy comic' });
    }

    // Kiểm tra rating hợp lệ (1-5)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Đánh giá không hợp lệ' });
    }

    // Tìm hoặc tạo mới đánh giá
    const [comicRating, created] = await ComicRating.findOrCreate({
      where: { comicId, userId },
      defaults: { score: rating },
    });

    // Nếu đã tồn tại, cập nhật
    if (!created) {
      await comicRating.update({ score: rating });
    }

    res.status(200).json({ message: 'Đánh giá thành công', rating });
  } catch (error) {
    console.error('Lỗi khi gửi đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi đánh giá' });
  }
};

module.exports = { getUserRating, createOrUpdateRating };