// app/controllers/chat.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (chatService) => ({
  // GET /api/chat/channels
  getChannels: asyncHandler(async (req, res) => {
    const userId = req.user?.userId || null; // guest => null

    const data = await chatService.getAllChannels({ userId });

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

    const data = await chatService.getChannelMessages({
      userId,
      channelId: parseInt(channelId, 10),
      beforeId: beforeId ? parseInt(beforeId, 10) : null,
      limit: validatedLimit,
    });

    return ok(res, { data });
  }),

  // POST /api/chat/messages/:messageId/pin
  pinMessage: asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const data = await chatService.pinMessage({
      messageId: parseInt(messageId, 10),
      userId,
    });

    return ok(res, { data });
  }),

  // POST /api/chat/messages/:messageId/unpin
  unpinMessage: asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const data = await chatService.unpinMessage({
      messageId: parseInt(messageId, 10),
      userId,
    });

    return ok(res, { data });
  }),

  // POST /api/chat/channels/:channelId/join
  joinChannel: asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user.userId;

    const data = await chatService.joinChannel({
      userId,
      channelId: parseInt(channelId, 10),
    });

    return ok(res, { data });
  }),

  // GET /api/chat/rooms
  listRooms: asyncHandler(async (req, res) => {
    const userId = req.user?.userId || null;

    const data = await chatService.listRooms({ userId });

    return ok(res, { data });
  }),
});
