// app/controllers/review.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");

module.exports = (reviewService) => ({
  // POST /api/reviews/draft
  saveDraft: asyncHandler(async (req, res) => {
    const userId = req.user?.userId || null; // nếu dùng protect
    const { chapterId, scriptData } = req.body;

    const data = await reviewService.saveDraft({
      userId,
      chapterId,
      scriptData,
    });

    return ok(res, { data });
  }),

  // GET /api/reviews/draft/:chapterId
  getDraft: asyncHandler(async (req, res) => {
    const userId = req.user?.userId || null;
    const { chapterId } = req.params;

    const data = await reviewService.getDraft({
      userId,
      chapterId: Number(chapterId),
    });

    return ok(res, { data });
  }),

  // POST /api/reviews/tts-preview
  ttsPreview: asyncHandler(async (req, res) => {
    const { text, voiceId } = req.body;

    const data = await reviewService.ttsPreview({
      text,
      voiceId,
    });

    return ok(res, { data });
  }),

  // POST /api/reviews/publish
  publishReview: asyncHandler(async (req, res) => {
    const userId = req.user?.userId || null;
    const { chapterId } = req.body;

    const data = await reviewService.publishReview({
      userId,
      chapterId,
    });

    return ok(res, { data });
  }),

  // GET /api/reviews/published/:chapterId
  getPublished: asyncHandler(async (req, res) => {
    const { chapterId } = req.params;

    const data = await reviewService.getPublished({
      chapterId: Number(chapterId),
    });

    return ok(res, { data });
  }),

  // POST /api/reviews/generate-dialogues-ai
  generateDialoguesAI: asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    const data = await reviewService.generateDialoguesFromImage({ imageUrl });
    return ok(res, { data });
  }),
});
