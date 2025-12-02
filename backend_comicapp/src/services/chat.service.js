// app/services/chat.service.js
const AppError = require("../utils/AppError");

module.exports = ({ sequelize, model }) => {
  const {
    Sequelize,
    ChatChannel,
    ChatMessage,
    ChatUserChannelState,
    TranslationGroup,
    TranslationGroupMember,
    User,
  } = model;
  const { Op } = Sequelize;

  return {
    /**
     * GET /api/chat/channels
     * Lấy danh sách kênh chat:
     *  - Tất cả kênh GLOBAL đang active
     *  - Các kênh ROOM mà user đã có ChatUserChannelState (đã "join"/từng vào)
     */
    async getAllChannels({ userId }) {
      // GUEST: chỉ trả về global, không join state
      if (!userId) {
        const channels = await ChatChannel.findAll({
          where: {
            isActive: true,
            type: "global",
          },
          order: [["createdAt", "ASC"]],
        });

        return channels.map((channel) => ({
          channelId: channel.channelId,
          name: channel.name,
          type: channel.type,
          isActive: !!channel.isActive,
          createdAt: channel.createdAt,
        }));
      }

      // USER ĐĂNG NHẬP: global + room đã có state
      const channels = await ChatChannel.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { type: "global" },
            { type: "room", "$userStates.userId$": userId },
          ],
        },
        include: [
          {
            model: ChatUserChannelState,
            as: "userStates",
            required: false,
            attributes: [],
          },
        ],
        order: [["createdAt", "ASC"]],
      });

      return channels.map((channel) => ({
        channelId: channel.channelId,
        name: channel.name,
        type: channel.type,
        isActive: !!channel.isActive,
        createdAt: channel.createdAt,
      }));
    },

    /**
     * GET /api/chat/channels/:channelId/messages
     * Lấy tin nhắn của 1 channel (phân trang)
     */
    async getChannelMessages({ userId, channelId, beforeId, limit }) {
      if (!userId || !channelId) {
        throw new AppError(
          "Thiếu userId hoặc channelId",
          400,
          "VALIDATION_ERROR"
        );
      }

      const channel = await ChatChannel.findByPk(channelId);
      if (!channel || !channel.isActive) {
        throw new AppError(
          "Không tìm thấy kênh chat",
          404,
          "CHANNEL_NOT_FOUND"
        );
      }

      // Nếu là room thì bắt buộc user đã join (có state)
      if (channel.type === "room") {
        const state = await ChatUserChannelState.findOne({
          where: { userId, channelId },
        });
        if (!state) {
          throw new AppError(
            "Bạn chưa tham gia room này",
            403,
            "ROOM_NOT_JOINED"
          );
        }
      }

      const where = { channelId };
      if (beforeId) {
        where.messageId = { [Op.lt]: beforeId };
      }

      // Lấy messages (DESC để phân trang hợp lý, sau đó reverse lại)
      let rows = await ChatMessage.findAll({
        where,
        order: [["messageId", "DESC"]],
        limit: limit || 20,
      });

      rows = rows.reverse();

      // Lấy user cho tất cả message 1 lần (tránh N+1)
      const userIds = [
        ...new Set(rows.map((m) => m.userId).filter((id) => id != null)),
      ];

      let usersMap = new Map();
      if (userIds.length > 0) {
        const users = await User.findAll({
          where: { userId: userIds },
          attributes: ["userId", "username", "avatar"],
        });
        usersMap = new Map(users.map((u) => [u.userId, u]));
      }

      const messages = rows.map((m) => {
        const sender = usersMap.get(m.userId) || null;
        return {
          messageId: m.messageId,
          channelId: m.channelId,
          content: m.content,
          replyToId: m.replyToId,
          isPinned: !!m.isPinned,
          createdAt: m.createdAt?.toISOString?.() || m.createdAt,
          sender: sender
            ? {
                userId: sender.userId,
                username: sender.username,
                avatar: sender.avatar,
              }
            : null,
        };
      });

      return messages;
    },

    /**
     * Tạo message mới trong channel
     */
    async createMessage({ channelId, userId, content, replyToId }) {
      if (!content?.trim()) {
        throw new AppError("Nội dung tin nhắn rỗng", 400, "EMPTY_MESSAGE");
      }

      const created = await ChatMessage.create({
        channelId,
        userId,
        content: content.trim(),
        replyToId: replyToId ?? null,
      });

      const sender = await User.findByPk(userId, {
        attributes: ["userId", "username", "avatar"],
      });

      return {
        messageId: created.messageId,
        channelId: created.channelId,
        content: created.content,
        replyToId: created.replyToId,
        isPinned: !!created.isPinned,
        createdAt:
          created.createdAt?.toISOString?.() || created.createdAt,
        sender: sender
          ? {
              userId: sender.userId,
              username: sender.username,
              avatar: sender.avatar,
            }
          : null,
      };
    },

    /**
     * Chỉ leader trong group của channel đó mới được pin
     */
    async pinMessage({ messageId, userId }) {
      if (!messageId) {
        throw new AppError("Thiếu messageId", 400, "VALIDATION_ERROR");
      }

      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        throw new AppError("Không tìm thấy tin nhắn", 404, "MESSAGE_NOT_FOUND");
      }

      const group = await TranslationGroup.findOne({
        where: { channelId: message.channelId },
      });

      if (!group) {
        throw new AppError(
          "Không xác định được nhóm của kênh chat này",
          400,
          "GROUP_NOT_FOUND"
        );
      }

      const member = await TranslationGroupMember.findOne({
        where: {
          groupId: group.groupId,
          userId,
        },
      });

      if (!member || member.role !== "leader") {
        throw new AppError(
          "Bạn không có quyền ghim tin nhắn trong nhóm này",
          403,
          "FORBIDDEN"
        );
      }

      message.isPinned = true;
      await message.save();

      return {
        messageId: message.messageId,
        isPinned: true,
      };
    },

    async unpinMessage({ messageId, userId }) {
      if (!messageId) {
        throw new AppError("Thiếu messageId", 400, "VALIDATION_ERROR");
      }

      const message = await ChatMessage.findByPk(messageId);
      if (!message) {
        throw new AppError("Không tìm thấy tin nhắn", 404, "MESSAGE_NOT_FOUND");
      }

      const group = await TranslationGroup.findOne({
        where: { channelId: message.channelId },
      });

      if (!group) {
        throw new AppError(
          "Không xác định được nhóm của kênh chat này",
          400,
          "GROUP_NOT_FOUND"
        );
      }

      const member = await TranslationGroupMember.findOne({
        where: {
          groupId: group.groupId,
          userId,
        },
      });

      if (!member || member.role !== "leader") {
        throw new AppError(
          "Bạn không có quyền bỏ ghim tin nhắn trong nhóm này",
          403,
          "FORBIDDEN"
        );
      }

      message.isPinned = false;
      await message.save();

      return {
        messageId: message.messageId,
        isPinned: false,
      };
    },

    async joinChannel({ userId, channelId }) {
      const channel = await ChatChannel.findByPk(channelId);
      if (!channel || channel.type !== "room") {
        throw new AppError("Không tìm thấy room", 404, "ROOM_NOT_FOUND");
      }

      await ChatUserChannelState.findOrCreate({
        where: { userId, channelId },
        defaults: {
          lastReadMessageId: null,
          hasSeenRules: false,
        },
      });

      return {
        channelId,
        joined: true,
      };
    },

    async listRooms({ userId }) {
      const rooms = await ChatChannel.findAll({
        where: {
          isActive: true,
          type: "room",
        },
        include: userId
          ? [
              {
                model: ChatUserChannelState,
                as: "userStates",
                required: false,
                where: { userId },
                attributes: ["stateId"],
              },
            ]
          : [],
        order: [["createdAt", "ASC"]],
      });

      return rooms.map((room) => ({
        channelId: room.channelId,
        name: room.name,
        type: room.type,
        isActive: !!room.isActive,
        joined: userId ? !!room.userStates?.length : false,
        createdAt: room.createdAt,
      }));
    },
  };
};
