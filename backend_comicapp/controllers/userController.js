const { User, Comic, Comment, ComicFollow, Chapter, Transaction, Wallet, CheckIn, ReadingHistory, sequelize } = require('../models');
const {Sequelize, Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');
const fs = require('fs/promises');


// Lấy thông tin profile người dùng
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetExpiration'] },
      include: [{
        model: Wallet,
        attributes: ['balance'],
      }],
    });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const totalRead = await Chapter.count({
      include: [{
        model: Comic,
        include: [{
          model: User,
          as: 'Followers',
          where: { userId },
          required: true,
        }],
      }],
    });

    const favorites = await ComicFollow.count({ where: { userId } });
    const comments = await Comment.count({ where: { userId } });

    res.json({
      ...(user.getProfileInfo ? user.getProfileInfo() : user.toJSON()),
      goldCoins: user.Wallet ? user.Wallet.balance : 0,
      totalRead,
      favorites,
      comments,
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Cập nhật thông tin người dùng
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, gender, birthday } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (username) user.username = username;
    if (gender) user.gender = gender;
    if (birthday) user.birthday = birthday;

    await user.save();

    res.json({
      message: 'Cập nhật thông tin cá nhân thành công',
      user: {
        ...(user.getProfileInfo ? user.getProfileInfo() : user.toJSON()),
        name: user.username,
      },
    });

  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu dữ liệu' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const isValidPassword = await user.validPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Thay đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi khi thay đổi mật khẩu:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!req.file) return res.status(400).json({ message: 'Không có file upload' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill' },
        { quality: 'auto' },
        { format: 'auto' },
      ],
    });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.avatar = result.secure_url;
    await user.save();

    // Xoá file tạm
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn('Không thể xoá file tạm:', err.message);
    }

    res.json({
      message: 'Cập nhật avatar thành công',
      user: user.getProfileInfo ? user.getProfileInfo() : user.toJSON(),
    });
  } catch (error) {
    console.error('Lỗi khi upload avatar', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
// Lấy chi tiết đồng vàng
const getGoldDetails = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy ví
    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) return res.status(404).json({ message: 'Không tìm thấy ví của người dùng.' });

    // Lịch sử giao dịch
    const transactions = await Transaction.findAll({
      where: { walletId: wallet.walletId },
      order: [['transactionDate', 'DESC']],
      limit: 20,
    });

    const transactionHistory = transactions.map(tx => ({
      id: tx.transactionId,
      description: tx.description || 'Giao dịch',
      amount: tx.type === 'debit' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
      date: new Date(tx.transactionDate).toLocaleDateString('vi-VN'),
    }));

    // Lấy check-in gần nhất
    const lastCheckin = await CheckIn.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Logic reset: nếu lastday là 7 và không trùng ngày với hôm nay
    if (lastCheckin && lastCheckin.day === 7) {
      const lastCheckinDate = new Date(lastCheckin.createdAt);
      lastCheckinDate.setHours(0, 0, 0, 0);
      
      // Nếu ngày check-in cuối cùng (ngày 7) không phải là hôm nay
      if (lastCheckinDate.getTime() !== today.getTime()) {
        // Xoá tất cả dữ liệu check-in của user này để reset
        await CheckIn.destroy({
          where: { userId }
        });
        
        // Reset lastCheckin thành null vì đã xoá
        lastCheckin = null;
      }
    }

    const dailyCheckin = [];

    let lastDay = 0;
    let lastCheckinDate = null;

    if (lastCheckin) {
      lastDay = lastCheckin.day;
      lastCheckinDate = new Date(lastCheckin.createdAt);
      lastCheckinDate.setHours(0, 0, 0, 0);
    }

    for (let i = 1; i <= 7; i++) {
      let checked = i <= lastDay; // check từ 1 đến day gần nhất
      let isToday = false;

      if (checked && lastCheckinDate) {
        // nếu ngày checkin cuối trùng hôm nay
        isToday = lastCheckinDate.getTime() === today.getTime();
      } else if (!checked) {
        // ngày chưa check-in → nếu chưa check hôm nay thì đánh dấu isToday cho ngày tiếp theo
        if (!lastCheckinDate || lastCheckinDate.getTime() < today.getTime()) {
          isToday = i === lastDay + 1; // ngày tiếp theo để điểm danh hôm nay
        }
      }

      dailyCheckin.push({ day: i, checked, isToday });
    }

    res.json({ transactionHistory, dailyCheckin });

  } catch (error) {
    console.error('Lỗi lấy thông tin Đồng vàng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};


// Hàm điểm danh hàng ngày
const performCheckIn = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lấy check-in gần nhất để xác định ngày tiếp theo
    const lastCheckin = await CheckIn.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    // Kiểm tra nếu đã điểm danh hôm nay
    if (lastCheckin) {
      const lastCheckinDate = new Date(lastCheckin.createdAt);
      lastCheckinDate.setHours(0, 0, 0, 0);
      
      if (lastCheckinDate.getTime() === today.getTime()) {
        await t.rollback();
        return res.status(400).json({ message: 'Bạn đã điểm danh hôm nay rồi.' });
      }
    }

    const wallet = await Wallet.findOne({ where: { userId } }, { transaction: t });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy ví.' });
    }

    // Xác định ngày điểm danh tiếp theo
    let nextDay = 1;
    if (lastCheckin) {
      // Reset về ngày 1 nếu đã hoàn thành chu kỳ 7 ngày
      nextDay = lastCheckin.day === 7 ? 1 : lastCheckin.day + 1;
    }

    const reward = 10;
    
    // Tạo bản ghi điểm danh mới
    await CheckIn.create({ userId, day: nextDay }, { transaction: t });
    
    // Cập nhật số dư ví
    wallet.balance += reward;
    await wallet.save({ transaction: t });
    
    // Tạo giao dịch
    await Transaction.create({
      walletId: wallet.walletId,
      amount: reward,
      description: `Điểm danh hàng ngày - Ngày ${nextDay}`,
      status: 'success',
      type: 'credit'
    }, { transaction: t });

    // Tạo danh sách dailyCheckin để trả về cho UI
    const dailyCheckin = [];
    for (let i = 1; i <= 7; i++) {
      const checked = i <= nextDay; // Tất cả các ngày từ 1 đến nextDay đều checked
      const isToday = i === nextDay; // Chỉ ngày hiện tại là isToday
      
      dailyCheckin.push({ day: i, checked, isToday });
    }

    await t.commit();
    
    // Trả về response đúng định dạng mà UI mong đợi
    res.json({ 
      message: 'Điểm danh thành công!', 
      newBalance: wallet.balance,
      dailyCheckin 
    });
  } catch (error) {
    await t.rollback();
    console.error('Lỗi khi điểm danh:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
const getUserActivity = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Sử dụng Promise.all để thực thi các truy vấn song song, tăng hiệu suất
        const [readingList, favoriteComics, commentHistory] = await Promise.all([
            getReadingList(userId),
            getFavoriteComics(userId),
            getCommentHistory(userId)
        ]);

        res.status(200).json({
            readingList,
            favoriteComics,
            commentHistory
        });

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu hoạt động:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
};


// 1. Lấy lịch sử đọc
async function getReadingList(userId) {
    // B1: Lấy bản ghi mới nhất cho mỗi comic
    const latestReadingHistory = await ReadingHistory.findAll({
        where: { userId },
        attributes: [
            'comicId',
            [Sequelize.fn('MAX', Sequelize.col('lastReadAt')), 'lastReadAt'],
        ],
        group: ['comicId'],
        raw: true,
    });

    if (latestReadingHistory.length === 0) return [];

    // B2: Lấy chi tiết
    const historyDetails = await Promise.all(
        latestReadingHistory.map(async (h) => {
            // Lấy thông tin chi tiết từ ReadingHistory
            const item = await ReadingHistory.findOne({
                where: {
                    userId,
                    comicId: h.comicId,
                    lastReadAt: h.lastReadAt
                },
                include: [
                    {
                        model: Comic,
                        attributes: ['comicId', 'title', 'coverImage', 'status'],
                    },
                    {
                        model: Chapter,
                        attributes: ['chapterNumber']
                    }
                ],
                order: [['lastReadAt', 'DESC']]
            });

            if (!item) return null;

            const comic = item.Comic;
            const chapter = item.Chapter;

            const lastChapterNumber = await Chapter.max('chapterNumber', {
              where: { comicId: comic.comicId }
            });


            const lastReadChapter = parseInt(chapter?.chapterNumber || 0);

            let statusText = "Đang đọc";
            if (lastReadChapter === lastChapterNumber) {
                statusText = "Hoàn thành";
            }

            return {
                id: comic.comicId,
                cover: comic.coverImage,
                title: comic.title,
                lastReadChapter: lastReadChapter,
                lastChapterNumber: lastChapterNumber || 0,
                lastRead: item.lastReadAt,
                status: statusText,
            };
        })
    );

    // Loại bỏ null (nếu có comic bị lỗi)
    return historyDetails.filter(Boolean);
}



// 2. Lấy truyện yêu thích (đang theo dõi)
async function getFavoriteComics(userId) {
    const user = await User.findByPk(userId);
    if (!user) return [];

    const followedComics = await user.getFollowingComics({
        attributes: [
            ['comicId', 'id'],
            'title',
            ['coverImage', 'cover']
        ],
        joinTableAttributes: [], // Không lấy dữ liệu từ bảng trung gian
        limit: 8, // Lấy nhiều hơn một chút phòng trường hợp cần hiển thị thêm
        order: [[Sequelize.literal('`ComicFollows`.`followDate`'), 'DESC']]
    });

    return followedComics;
}

// 3. Lấy lịch sử bình luận
async function getCommentHistory(userId) {
    const comments = await Comment.findAll({
        where: { userId },
        include: [{
            model: Comic,
            attributes: ['title']
        }],
        limit: 5, // Lấy 5 bình luận gần nhất
        order: [['createdAt', 'DESC']]
    });

    // Định dạng lại dữ liệu
    return comments.map(comment => ({
        id: comment.commentId,
        content: comment.content,
        comicTitle: comment.Comic.title,
        context: `${comment.Comic.title}`,
        timestamp: comment.createdAt,
    }));
}
// Lấy danh sách người dùng (phân trang cơ bản)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      attributes: [
        "userId",
        "username",
        "email",
        "avatar",
        "role",
        "status",
        "isVerified",
        "lastLogin",
        "createdAt",
      ],
      include: [{ model: Wallet, attributes: ["balance"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      users: rows,
      totalUsers: count,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
//Khóa / mở khóa tài khoản
const toggleUserStatus = async (req, res) => {
  try {
    const { userId, action } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (action === 'suspend') {
      user.status = 'suspended';
    } else if (action === 'activate') {
      user.status = 'active';
    } else {
      return res.status(400).json({ message: 'Hành động không hợp lệ' });
    }

    await user.save();
    res.json({ message: `Đã ${action === 'suspend' ? 'khóa' : 'mở khóa'} tài khoản thành công` });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Cấp quyền admin
const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.role = 'admin';
    await user.save();

    res.json({ message: 'Đã cấp quyền admin thành công' });
  } catch (error) {
    console.error('Lỗi khi cấp quyền admin:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = { 
  getProfile, 
  updateProfile, 
  changePassword, 
  uploadAvatar, 
  getGoldDetails, 
  performCheckIn,
  getUserActivity,
  getAllUsers,
  toggleUserStatus,
  promoteToAdmin
};