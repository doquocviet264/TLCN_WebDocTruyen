// app/controllers/chat.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (chatService) => ({
  // GET /api/chat/channels
  getChannels: asyncHandler(async (req, res) => {
    const data = await chatService.getAllChannels();
    return ok(res, { data });
  }),

  // GET /api/chat/channels/:channelId/messages
  getChannelMessages: asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { beforeId, limit = 20 } = req.query;
    const userId = req.user.userId;

    const parsedLimit = parseInt(limit, 10);
    const validatedLimit =
      !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;

    const data = await chatService.getChannelMessagesForUser({
      userId,
      channelId: parseInt(channelId, 10),
      beforeId: beforeId ? parseInt(beforeId, 10) : null,
      limit: validatedLimit,
    });

    return ok(res, { data });
  }),
});
