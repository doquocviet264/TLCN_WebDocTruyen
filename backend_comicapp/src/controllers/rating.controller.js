// app/controllers/rating.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (ratingService) => ({
  getUserRating: asyncHandler(async (req, res) => {
    const { comicId } = req.params;
    const userId = req.user.userId;
    const data = await ratingService.getUserRating({ comicId, userId });
    return ok(res, { data: { rating: data } });
  }),

  createOrUpdateRating: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { comicId, rating } = req.body;
    const data = await ratingService.createOrUpdateRating({ comicId, rating, userId });
    return ok(res, { data });
  }),
});
