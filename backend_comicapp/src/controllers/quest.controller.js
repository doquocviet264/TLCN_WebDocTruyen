// app/controllers/quest.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (questService) => ({
  getDailyQuests: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const data = await questService.getDailyQuests({ userId });
    return ok(res, { data });
  }),

  claimQuestReward: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { userQuestId } = req.params;
    const data = await questService.claimQuestReward({ userId, userQuestId });
    return ok(res, { data });
  }),

  updateQuestProgress: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { category, amount } = req.body;
    const data = await questService.updateQuestProgress({ userId, category, amount });
    return ok(res, { data });
  }),
});
