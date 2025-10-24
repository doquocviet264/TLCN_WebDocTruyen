// app/services/history.service.js
const AppError = require("../utils/AppError");
const { updateQuestProgress } = require("./update-quest.service.js"); // đổi path nếu file bạn đặt tên khác

module.exports = ({ sequelize, model, readingHistoryRepo, chapterRepo }) => {
  return {
    // POST /history/update
    async updateReadingHistory({ userId, comicId, chapterId }) {
      if (!comicId || !chapterId) {
        throw new AppError("Thiếu comicId hoặc chapterId", 400, "VALIDATION_ERROR");
      }
      const chapter = await chapterRepo.findOne(
        { chapterId, comicId },
        { model }
      );

      if (!chapter) {
        throw new AppError("Chương này không thuộc truyện được chọn",400, 'VALIDATION_ERROR');
      }

      const existing = await readingHistoryRepo.findOne({ where: { userId, comicId } }, { model});
      if (existing) {
        existing.chapterId = chapterId;
        existing.lastReadAt = new Date();
        await existing.save();
      } else {
        await readingHistoryRepo.create(
          { userId, comicId, chapterId, lastReadAt: new Date() },
          { model}
        );
      }

      try { await updateQuestProgress(userId, "reading"); } catch (_) {}
      return { message: "Cập nhật lịch sử đọc thành công" };
    },

    // GET /history?limit=
    async getReadingHistory({ userId, limit = 10 }) {
      const rows = await readingHistoryRepo.findAllForUser({ userId, limit }, { model });

      const formatted = rows.map((item) => ({
        id: item.Comic?.comicId,
        title: item.Comic?.title,
        slug: item.Comic?.slug,
        image: item.Comic?.coverImage,
        lastChapter: item.Chapter?.chapterNumber,
        chapterTitle: item.Chapter?.title,
        lastReadAt: item.lastReadAt,
      }));

      return formatted;
    },

    async getReadingHistoryByComic({ userId, comicId }) {
      const item = await readingHistoryRepo.findOne(
        {
          where: { userId, comicId },
          include: [
            {
              model: model.Comic,
              attributes: ["comicId", "title", "slug", "coverImage"],
            },
            {
              model: model.Chapter,
              attributes: ["chapterId", "title", "chapterNumber"],
            },
          ],
        },
        { model }
      );

      // Nếu không tìm thấy lịch sử, trả về null
      if (!item) {
        return null;
      }

      // Format dữ liệu trả về cho nhất quán
      return {
        id: item.Comic?.comicId,
        title: item.Comic?.title,
        slug: item.Comic?.slug,
        image: item.Comic?.coverImage,
        lastChapter: item.Chapter?.chapterNumber,
        chapterTitle: item.Chapter?.title,
        lastReadAt: item.lastReadAt,
      };
    },

    // DELETE /history/clear
    async clearReadingHistory({ userId }) {
      await readingHistoryRepo.destroy({ userId }, { model });
      return { message: "Đã xóa toàn bộ lịch sử đọc" };
    },

    // DELETE /history/:comicId
    async deleteReadingHistoryByComic({ userId, comicId }) {
      const deleted = await readingHistoryRepo.destroy({ userId, comicId }, { model });
      if (deleted === 0) throw new AppError("Không tìm thấy lịch sử đọc của truyện này", 404, "NOT_FOUND");
      return { message: "Đã xóa lịch sử đọc của truyện", comicId: Number(comicId) };
    },
  };
};
