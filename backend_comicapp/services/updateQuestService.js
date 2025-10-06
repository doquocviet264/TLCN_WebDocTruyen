const db = require('../models');
const UserQuest = db.UserQuest;
const Quest = db.Quest;
const { fn, col, Op } = require('sequelize');
const { Sequelize } = db; 

async function updateQuestProgress(userId, category, amount = 1) {
  const today = new Date().toISOString().split('T')[0];
  // Tìm quest của user hôm nay thuộc category
  const userQuest = await UserQuest.findOne({
    where: {
      userId,
      [Op.and]: [
            Sequelize.where(fn('DATE', col('assignedDate')), today) 
        ],
      isClaimed: false
    },
    include: [{
      model: Quest,
      where: { category },
      attributes: ['targetValue']
    }]
  });


  if (!userQuest) return null;

  // Cập nhật tiến độ
  const newProgress = Math.min(
    userQuest.progress + amount,
    userQuest.Quest.targetValue
  );

  await userQuest.update({ progress: newProgress });
  return {
    progress: newProgress,
    target: userQuest.Quest.targetValue,
    completed: newProgress >= userQuest.Quest.targetValue
  };
}

module.exports = { updateQuestProgress };