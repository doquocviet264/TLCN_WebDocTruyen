// app/services/update-quest.service.js

module.exports = ({ model, repos, sequelize }) => {
  const { Op, fn, col } = model.Sequelize; // lấy helper từ instance hiện tại
  const userQuestRepo = repos.userQuestRepo;

  async function updateQuestProgress({ userId, category, amount = 1 }, { transaction } = {}) {
    const today = new Date().toISOString().split("T")[0];

    // Tìm quest trong ngày theo category, chưa claim
    const userQuest = await userQuestRepo.findOne(
      {
        userId,
        isClaimed: false,
        [Op.and]: [ model.Sequelize.where(fn("DATE", col("assignedDate")), today) ],
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

    return {
      progress: newProgress,
      target,
      completed: newProgress >= target,
    };
  }

  return {
    updateQuestProgress,
  };
};
