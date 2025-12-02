// app/services/moderation.service.js

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

// Chỉ dùng models nếu sau này bạn cần, hiện tại không cần cũng được
module.exports = (models) => {
  return {
    /**
     * Đánh giá nội dung tin nhắn
     * - Nếu rỗng -> ALLOW
     * - Nếu chứa từ khóa cấm -> BLOCK
     * - Ngược lại -> ALLOW
     */
    async evaluateMessage({ user, channelId, content }) {
      if (!user || !user.userId || !channelId) {
        return { action: "ALLOW" };
      }

      const trimmed = (content || "").trim();
      if (!trimmed) return { action: "ALLOW" };

      const lower = trimmed.toLowerCase();
      const hasBanned = BANNED_WORDS.some((w) => lower.includes(w));

      if (hasBanned) {
        return {
          action: "BLOCK",
          reason: "OFFENSIVE_LANGUAGE",
        };
      }

      return { action: "ALLOW" };
    },
  };
};
