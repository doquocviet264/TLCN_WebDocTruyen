// app/services/quest.service.js
const AppError = require("../utils/AppError");

module.exports = ({ sequelize, model, repos }) => {
  const { questRepo, userQuestRepo, walletRepo, transactionRepo } = repos;
  const { Op, fn, col } = model.Sequelize;

  function mapUserQuest(q) {
    return {
      id: q.userQuestId,
      title: q.Quest.title,
      reward: q.Quest.rewardCoins,
      progress: q.progress,
      target: q.Quest.targetValue,
      claimed: q.isClaimed,
      category: q.Quest.category,
    };
  }

  async function selectRandomQuests(limit = 3) {
    const all = await questRepo.findAll({}, { model });
    if (!all.length) throw new AppError("Chưa có quest template", 404, "QUEST_TEMPLATE_EMPTY");
    // shuffle nhẹ nhàng
    const shuffled = all.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  return {
    // GET /quests/daily
    async getDailyQuests({ userId }) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Kiểm tra quest đã phát hôm nay?
      const existing = await userQuestRepo.findAll(
        {
          userId,
          [Op.and]: [sequelize.where(fn("DATE", col("assignedDate")), today)],
        },
        {
          model,
          include: [{ model: model.Quest, attributes: ["questId", "title", "targetValue", "rewardCoins", "category"] }],
        }
      );

      if (existing.length > 0) {
        return existing.map(mapUserQuest);
      }

      // Tạo mới 3 quest ngẫu nhiên
      const selected = await selectRandomQuests(3);
      const rows = selected.map((q) => ({
        userId,
        questId: q.questId,
        progress: 0,
        isClaimed: false,
      }));
      await userQuestRepo.bulkCreate(rows, { model });

      // Lấy lại theo ngày
      const created = await userQuestRepo.findAll(
        {
          userId,
          [Op.and]: [sequelize.where(fn("DATE", col("assignedDate")), today)],
        },
        {
          model,
          include: [{ model: model.Quest, attributes: ["questId", "title", "targetValue", "rewardCoins", "category"] }],
        }
      );

      return created.map(mapUserQuest);
    },

    // POST /quests/:userQuestId/claim
    async claimQuestReward({ userId, userQuestId }) {
      const userQuest = await userQuestRepo.findOne(
        { userQuestId, userId },
        { model, include: [{ model: model.Quest, attributes: ["title", "targetValue", "rewardCoins"] }] }
      );
      if (!userQuest) throw new AppError("Không tìm thấy nhiệm vụ", 404, "QUEST_NOT_FOUND");
      if (userQuest.isClaimed) throw new AppError("Đã nhận thưởng nhiệm vụ này rồi", 400, "ALREADY_CLAIMED");
      if (userQuest.progress < userQuest.Quest.targetValue)
        throw new AppError("Chưa hoàn thành nhiệm vụ", 400, "NOT_COMPLETED");

      await sequelize.transaction(async (t) => {
        // Cập nhật trạng thái claim
        await userQuestRepo.updateById(
          userQuestId,
          { isClaimed: true, claimedAt: new Date() },
          { model, transaction: t }
        );

        // Cộng vàng vào ví
        const wallet = await walletRepo.findOne({ userId }, { model, transaction: t });
        if (!wallet) throw new AppError("Không tìm thấy ví của người dùng", 404, "WALLET_NOT_FOUND");

        const newBalance = (wallet.balance || 0) + (userQuest.Quest.rewardCoins || 0);
        await walletRepo.updateById(wallet.walletId, { balance: newBalance }, { model, transaction: t });

        // Ghi transaction
        await transactionRepo.create(
          {
            walletId: wallet.walletId,
            amount: userQuest.Quest.rewardCoins,
            status: "success",
            type: "credit",
            description: `Nhận thưởng nhiệm vụ: ${userQuest.Quest.title}`,
          },
          { model, transaction: t }
        );
      });

      return {
        message: "Nhận thưởng thành công",
        reward: userQuest.Quest.rewardCoins,
      };
    },

    // PUT /quests/progress
    async updateQuestProgress({ userId, category, amount = 1 }) {
      const today = new Date().toISOString().split("T")[0];

      const userQuest = await userQuestRepo.findOne(
        {
          userId,
          isClaimed: false,
          [Op.and]: [sequelize.where(fn("DATE", col("assignedDate")), today)],
        },
        {
          model,
          include: [{ model: model.Quest, where: { category }, attributes: ["targetValue"] }],
        }
      );

      if (!userQuest) {
        throw new AppError("Không tìm thấy nhiệm vụ phù hợp", 404, "QUEST_NOT_FOUND");
      }

      const newProgress = Math.min(
        (userQuest.progress || 0) + (parseInt(amount, 10) || 1),
        userQuest.Quest.targetValue
      );

      await userQuestRepo.updateById(
        userQuest.userQuestId,
        { progress: newProgress },
        { model }
      );

      return {
        message: "Cập nhật tiến độ thành công",
        progress: newProgress,
        target: userQuest.Quest.targetValue,
        completed: newProgress >= userQuest.Quest.targetValue,
      };
    },
  };
};
