const db = require('../models');

const updateReadingHistory = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { comicId, chapterId } = req.body;

        if (!comicId || !chapterId) {
            return res.status(400).json({ message: "Thiếu comicId hoặc chapterId" });
        }

        // Tìm lịch sử cũ của truyện này
        const existingHistory = await db.ReadingHistory.findOne({
            where: { userId, comicId }
        });

        if (existingHistory) {
            // Nếu đã tồn tại, cập nhật chapter và thời gian đọc
            existingHistory.chapterId = chapterId;
            existingHistory.lastReadAt = new Date();
            await existingHistory.save();
        } else {
            // Nếu chưa có, tạo mới
            await db.ReadingHistory.create({
                userId,
                comicId,
                chapterId,
                lastReadAt: new Date()
            });
        }
        
        res.status(200).json({ message: "Cập nhật lịch sử đọc thành công" });

    } catch (error) {
        console.error("Lỗi cập nhật lịch sử đọc:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
// Lấy lịch sử đọc của user
const getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    const history = await db.ReadingHistory.findAll({
      where: { userId },
      include: [
        {
          model: db.Comic,
          attributes: ['comicId', 'title', 'slug', 'coverImage'],
          include: [
            {
              model: db.Chapter,
              attributes: ['chapterNumber'],
              order: [['chapterNumber', 'DESC']],
              limit: 1,
              separate: true,
            }
          ]
        },
        {
          model: db.Chapter,
          attributes: ['chapterId', 'chapterNumber', 'title']
        }
      ],
      order: [['lastReadAt', 'DESC']],
      limit: limit
    });

    // Format dữ liệu trả về
    const formattedHistory = history.map(item => ({
      id: item.Comic.comicId,
      title: item.Comic.title,
      slug: item.Comic.slug,
      image: item.Comic.coverImage,
      lastChapter: item.Chapter.chapterNumber,
      chapterTitle: item.Chapter.title,
      lastReadAt: item.lastReadAt
    }));

    res.json(formattedHistory);

  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đọc:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Xóa lịch sử đọc
const clearReadingHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    await db.ReadingHistory.destroy({
      where: { userId }
    });

    res.json({ message: "Đã xóa toàn bộ lịch sử đọc" });

  } catch (error) {
    console.error("Lỗi khi xóa lịch sử đọc:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
module.exports = { updateReadingHistory, getReadingHistory,clearReadingHistory };