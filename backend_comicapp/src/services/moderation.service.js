// app/services/moderation.service.js
const { Op } = require("sequelize");

const BANNED_WORDS = [
  "dm",
  "đm",
  "vcl",
  "clm",
  "con chó",
  "fuck",
  "shit",
  "địt",
  "vl",
];

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function getEndOfToday() {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
}

module.exports = (repositories, models, BOT_USER_ID) => {
  const { chatStrikeRepository, chatMuteRepository } = repositories;
  const { ChatStrike } = models;

  return {
    async checkMute({ userId, channelId }) {
      if (!userId || !channelId) {
        return { isMuted: false, mute: null };
      }

      if (chatMuteRepository) {
        // ✅ TRUYỀN { model: models } VÀO
        return chatMuteRepository.getActiveMute(
          { userId, channelId },
          { model: models }
        );
      }

      // Fallback nếu không dùng repo
      const now = new Date();
      const mute = await models.ChatMute.findOne({
        where: {
          userId,
          channelId,
          mutedUntil: { [Op.gt]: now },
        },
        order: [["mutedUntil", "DESC"]],
      });

      return { isMuted: !!mute, mute };
    },

    async evaluateMessage({ user, channelId, content }) {
      if (!user || !user.userId || !channelId) {
        return { action: "ALLOW" };
      }

      const trimmed = (content || "").trim();
      if (!trimmed) return { action: "ALLOW" };

      const lower = trimmed.toLowerCase();
      const hasBanned = BANNED_WORDS.some((w) => lower.includes(w));

      if (hasBanned) {
        return { action: "WARN", reason: "OFFENSIVE_LANGUAGE" };
      }

      return { action: "ALLOW" };
    },

    async countTodayStrikes({ userId, channelId }) {
      if (!userId || !channelId) return 0;

      const start = getStartOfToday();

      const count = await ChatStrike.count({
        where: {
          userId,
          channelId,
          createdAt: { [Op.gte]: start },
        },
      });

      return count || 0;
    },

    async addStrike({
      userId,
      channelId,
      messageId = null,
      score = 1,
      reason,
      source = "AUTO_RULE",
      createdBy,
    }) {
      if (!userId || !channelId || !reason || !createdBy) {
        console.error("addStrike: missing parameters");
        return null;
      }

      if (chatStrikeRepository) {
        return chatStrikeRepository.addStrike(
          { userId, channelId, messageId, score, reason, source, createdBy },
          { model: models }
        );
      }

      return models.ChatStrike.create({
        userId,
        channelId,
        messageId,
        score,
        reason,
        source,
        createdBy,
      });
    },

    async shouldEscalateToMute({ userId, channelId }) {
      const strikesToday = await this.countTodayStrikes({ userId, channelId });
      const threshold = 3; // tuỳ bạn config

      if (strikesToday >= threshold) {
        return {
          shouldMute: true,
          strikesToday,
          threshold,
        };
      }

      return {
        shouldMute: false,
        strikesToday,
        threshold,
      };
    },

    async createMute({ userId, channelId, mutedUntil, reason, createdBy }) {
      if (!userId || !channelId || !reason || !createdBy) {
        console.error("createMute: missing parameters");
        return null;
      }

      const finalMutedUntil = mutedUntil || getEndOfToday();

      if (chatMuteRepository) {
        return chatMuteRepository.createMute(
          {
            userId,
            channelId,
            mutedUntil: finalMutedUntil,
            reason,
            createdBy,
          },
          { model: models }
        );
      }

      return models.ChatMute.create({
        userId,
        channelId,
        mutedUntil: finalMutedUntil,
        reason,
        createdBy,
      });
    },
  };
};
