// app/services/update-quest.service.js
const { Op } = require("sequelize");

module.exports = ({ model, userQuestRepo }) => {
  const { fn, col } = model.Sequelize; // dùng instance hiện tại

  return {
    async updateQuestProgress({ userId, category, amount = 1 }, { transaction } = {}) {
      const today = new Date().toISOString().split("T")[0];

      // Tìm quest trong ngày theo category, chưa claim
      const userQuest = await userQuestRepo.findOne(
        {
          userId,
          isClaimed: false,
          [Op.and]: [
            model.Sequelize.where(fn("DATE", col("assignedDate")), today),
          ],
        },
        {
          model,
          include: [
            {
              model: model.Quest,
              where: { category },
              attributes: ["targetValue"],
            },
          ],
          transaction,
        }
      );

      if (!userQuest) return null;

      // Tính progress mới (không vượt target)
      const target = userQuest.Quest.targetValue;
      const newProgress = Math.min((userQuest.progress || 0) + amount, target);

      // Cập nhật
      userQuest.progress = newProgress;
      await userQuestRepo.save(userQuest, { transaction });

      console.log("[Quest] Progress updated:", {
        userId,
        category,
        progress: newProgress,
        target,
      });

      return {
        progress: newProgress,
        target,
        completed: newProgress >= target,
      };
    },
  };
};
