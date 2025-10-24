// app/services/rating.service.js
const AppError = require("../utils/AppError");

module.exports = ({ model, repos }) => {
  const { comicRepo, comicRatingRepo } = repos;

  return {
    // GET /ratings/:comicId/user
    async getUserRating({ comicId, userId }) {
      const row = await comicRatingRepo.findOne({ comicId, userId }, { model });
      return row ? row.score : null;
    },

    // POST /ratings
    async createOrUpdateRating({ comicId, rating, userId }) {
      // check comic exists
      const comic = await comicRepo.findByPk(comicId, {}, { model });
      if (!comic) throw new AppError("Không tìm thấy comic", 404, "COMIC_NOT_FOUND");

      // validate score
      const score = Number(rating);
      if (!Number.isInteger(score) || score < 1 || score > 5) {
        throw new AppError("Đánh giá không hợp lệ", 400, "INVALID_RATING");
      }

      // upsert-like: findOrCreate rồi update nếu đã tồn tại
      const [row, created] = await comicRatingRepo.findOrCreate(
        { comicId, userId },
        { score },
        { model }
      );

      if (!created) {
        await comicRatingRepo.updateById(row.ratingId, { score }, { model });
      }

      return { message: "Đánh giá thành công", rating: score };
    },
  };
};
