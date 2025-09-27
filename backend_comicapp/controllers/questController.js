const db = require('../models');
const { Sequelize } = db;
const Quest = db.Quest;
const UserQuests = db.UserQuest;
const { Op, fn, col } = require('sequelize');
class QuestController {
  // Lấy danh sách nhiệm vụ hàng ngày của user
  getDailyQuests = async (req, res) => {
    try {
      const userId = req.user.userId; // từ JWT middleware
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Kiểm tra user đã có quests hôm nay chưa
      const existingQuests = await UserQuests.findAll({
        where: {
            userId: userId,
            [Op.and]: [
            Sequelize.where(fn('DATE', col('assignedDate')), today)
            ]
        },
        include: [{
            model: Quest,
            attributes: ['questId', 'title', 'targetValue', 'rewardCoins', 'category']
        }]
        });

      // Nếu đã có quests thì trả về
      if (existingQuests.length > 0) {
        const formattedQuests = existingQuests.map(quest => ({
          id: quest.userQuestId,
          title: quest.Quest.title,
          reward: quest.Quest.rewardCoins,
          progress: quest.progress,
          target: quest.Quest.targetValue,
          claimed: quest.isClaimed,
          category: quest.Quest.category
        }));

        return res.json({
          success: true,
          data: formattedQuests
        });
      }

      // Nếu chưa có, tạo mới 3 quests ngẫu nhiên
      const randomQuests = await this.generateDailyQuests(userId, today);
      
      res.json({
        success: true,
        data: randomQuests
      });

    } catch (error) {
      console.error('Get daily quests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách nhiệm vụ'
      });
    }
  };

  // Tạo 3 quests ngẫu nhiên cho user
  generateDailyQuests = async (userId, date) => {
    try {
      // Lấy tất cả quest template active
      const allQuests = await Quest.findAll();
      
      // Xáo trộn ngẫu nhiên và chọn 3 cái
      const shuffledQuests = allQuests.sort(() => 0.5 - Math.random());
      const selectedQuests = shuffledQuests.slice(0, 3);

      // Tạo user quests
      const userQuestsData = selectedQuests.map(quest => ({
        userId: userId,
        questId: quest.questId,
        assignedDate: date,
        progress: 0,
        isClaimed: false
      }));

      await UserQuests.bulkCreate(userQuestsData);

      // Trả về danh sách quests đã tạo
      const createdQuests = await UserQuests.findAll({
        where: {
          userId: userId,
          assignedDate: date
        },
        include: [{
          model: Quest,
          attributes: ['questId', 'title', 'targetValue', 'rewardCoins', 'category']
        }]
      });

      return createdQuests.map(quest => ({
        id: quest.userQuestId,
        title: quest.Quest.title,
        reward: quest.Quest.rewardCoins,
        progress: quest.progress,
        target: quest.Quest.targetValue,
        claimed: quest.isClaimed,
        category: quest.Quest.category
      }));

    } catch (error) {
      throw new Error('Không thể tạo nhiệm vụ: ' + error.message);
    }
  };

  // Nhận thưởng quest
  claimQuestReward = async (req, res) => {
    try {
      const userId = req.user.userId;
      const { userQuestId } = req.params;

      // Tìm quest của user
      const userQuest = await UserQuests.findOne({
        where: {
          userQuestId: userQuestId,
          userId: userId
        },
        include: [{
          model: Quest,
          attributes: ['title', 'targetValue', 'rewardCoins']
        }]
      });

      if (!userQuest) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhiệm vụ'
        });
      }

      // Kiểm tra điều kiện nhận thưởng
      if (userQuest.isClaimed) {
        return res.status(400).json({
          success: false,
          message: 'Đã nhận thưởng nhiệm vụ này rồi'
        });
      }

      if (userQuest.progress < userQuest.Quest.targetValue) {
        return res.status(400).json({
          success: false,
          message: 'Chưa hoàn thành nhiệm vụ'
        });
      }

      // Cập nhật trạng thái đã nhận thưởng
      await userQuest.update({
        isClaimed: true,
        claimedAt: new Date()
      });

      // Cộng đồng vàng vào ví user (giả sử có bảng Wallet)
      const wallet = await db.Wallet.findOne({ where: { userId: userId } });
      const newBalance = wallet.balance + userQuest.Quest.rewardCoins;
      await wallet.update({ balance: newBalance });

      // Tạo lịch sử giao dịch
      await db.Transaction.create({
        walletId: wallet.walletId,
        amount: userQuest.Quest.rewardCoins,
        status: 'success',
        type: 'credit',
        description: `Nhận thưởng nhiệm vụ: ${userQuest.Quest.title}`
      });

      res.json({
        success: true,
        message: 'Nhận thưởng thành công',
        data: {
          reward: userQuest.Quest.rewardCoins,
          newBalance: newBalance
        }
      });

    } catch (error) {
      console.error('Claim quest reward error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi nhận thưởng'
      });
    }
  };

  // API test: Cập nhật tiến độ quest (trigger khi user thực hiện hành động)
  updateQuestProgress = async (req, res) => {
    try {
      const userId = req.user.userId;
      const { category, amount = 1 } = req.body;
      const today = new Date().toISOString().split('T')[0];

      // Tìm quest thuộc category đó của user trong ngày
      const userQuest = await UserQuests.findOne({
        where: {
          userId: userId,
          assignedDate: today,
          isClaimed: false
        },
        include: [{
          model: Quest,
          where: { category: category },
          attributes: ['targetValue']
        }]
      });

      if (!userQuest) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhiệm vụ phù hợp'
        });
      }

      // Cập nhật tiến độ (không vượt quá target)
      const newProgress = Math.min(userQuest.progress + amount, userQuest.Quest.targetValue);
      await userQuest.update({ progress: newProgress });

      const isCompleted = newProgress >= userQuest.Quest.targetValue;

      res.json({
        success: true,
        message: 'Cập nhật tiến độ thành công',
        data: {
          progress: newProgress,
          target: userQuest.Quest.targetValue,
          completed: isCompleted
        }
      });

    } catch (error) {
      console.error('Update quest progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật tiến độ'
      });
    }
  };
}

module.exports = new QuestController();