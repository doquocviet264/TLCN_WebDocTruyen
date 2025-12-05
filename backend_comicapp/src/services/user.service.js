// app/services/user.service.js
const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary"); 
const userQuestRepo = require("../repositories/user-quest.repo");
const createUpdateQuestService = require("./update-quest.service");
module.exports = ({ sequelize, model, repos }) => {
  const {
    userRepo, walletRepo, transactionRepo, checkinRepo,
    readingHistoryRepo, commentRepo, comicFollowRepo, comicRepo, chapterRepo
  } = repos;
  const { Sequelize } = model;
  const { updateQuestProgress } = createUpdateQuestService({ model, userQuestRepo });

  return {
    // GET /user/profile
    async getProfile({ userId }) {
      const user = await userRepo.findByPk(userId, {
        model,
        attributes: { exclude: ["password", "resetToken", "resetExpiration"] },
        include: [{ model: model.Wallet, attributes: ["balance"] }],
      });
      if (!user) throw new AppError("Không tìm thấy người dùng", 404, "USER_NOT_FOUND");

      // tổng comic đã có lịch sử đọc (gọn hơn)
      const totalRead = await model.ReadingHistory.count({ where: { userId } });
      const favorites = await comicFollowRepo.countFollowedByUser(userId, { model });
      const comments = await commentRepo.count({ userId }, { model });

      const profile = user.getProfileInfo ? user.getProfileInfo() : user.toJSON();
      return {
        ...profile,
        goldCoins: user.Wallet ? user.Wallet.balance : 0,
        totalRead,
        favorites,
        comments,
      };
    },

    // PUT /user/profile
    async updateProfile({ userId, username, gender, birthday }) {
      const user = await userRepo.findByPk(userId, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 404, "USER_NOT_FOUND");

      const patch = {};
      if (username) patch.username = username;
      if (gender) patch.gender = gender;
      if (birthday) patch.birthday = birthday;

      if (Object.keys(patch).length) {
        await userRepo.updateById(userId, patch, { model });
      }
      const updated = await userRepo.findByPk(userId, { model });
      const data = updated.getProfileInfo ? updated.getProfileInfo() : updated.toJSON();
      return { message: "Cập nhật thông tin cá nhân thành công", user: { ...data, name: updated.username } };
    },

    // PUT /user/password
    async changePassword({ userId, currentPassword, newPassword }) {
      if (!currentPassword || !newPassword) {
        throw new AppError("Thiếu dữ liệu", 400, "VALIDATION_ERROR");
      }
      const user = await userRepo.findByPk(userId, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 404, "USER_NOT_FOUND");

      const ok = await user.validPassword(currentPassword);
      if (!ok) throw new AppError("Mật khẩu hiện tại không đúng", 400, "INVALID_PASSWORD");

      user.password = newPassword;
      await user.save();
      return { message: "Thay đổi mật khẩu thành công" };
    },

    // POST /user/avatar
    async uploadAvatar({ userId, filePath }) {
      if (!filePath) throw new AppError("Không có file upload", 400, "NO_FILE");

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "avatars",
        transformation: [{ width: 200, height: 200, crop: "fill" }, { quality: "auto" }, { format: "auto" }],
      });

      const user = await userRepo.findByPk(userId, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 404, "USER_NOT_FOUND");

      user.avatar = result.secure_url;
      await user.save();

      const data = user.getProfileInfo ? user.getProfileInfo() : user.toJSON();
      return { message: "Cập nhật avatar thành công", user: data, tmpPath: filePath };
    },

    // GET /user/gold-details
    async getGoldDetails({ userId }) {
      const wallet = await walletRepo.findOne({ userId }, { model });
      if (!wallet) throw new AppError("Không tìm thấy ví người dùng.", 404);

      // Lịch sử giao dịch
      const transactions = await transactionRepo.findAll(
        { walletId: wallet.walletId },
        { model, limit: 20, order: [["transactionDate","DESC"]] }
      );

      const transactionHistory = transactions.map((tx) => ({
        id: tx.transactionId,
        description: tx.description,
        amount: tx.type === "debit" ? -tx.amount : tx.amount,
        date: new Date(tx.transactionDate).toLocaleDateString("vi-VN"),
      }));

      // Lấy streak stats
      const stats = await checkinRepo.findByUser(userId, { model });

      const dayStreak = stats?.currentStreak || 0;
      const longestStreak = stats?.longestStreak || 0;   // ⭐ THÊM
      const lastDate = stats?.lastCheckinDate || null;

      const todayStr = new Date().toLocaleDateString("sv-SE");
      const todayChecked = lastDate === todayStr;

      // Build UI 7 ô
      const CYCLE = 7;
      let filled = dayStreak % CYCLE;
      if (filled === 0 && dayStreak > 0) filled = CYCLE;

      let todayIndex = todayChecked ? filled : filled + 1;
      if (todayIndex > CYCLE) todayIndex = 1;

      const dailyCheckin = [];
      for (let i = 1; i <= CYCLE; i++) {
        dailyCheckin.push({
          day: i,
          checked: i <= filled,
          isToday: i === todayIndex,
        });
      }

      return {
        transactionHistory,
        dailyCheckin,
        dayStreak,
        longestStreak, 
      };
    },
      // GET /user/transactions?limit=20&offset=0&type=credit
    async getListTransactions({ userId, limit = 20, offset = 0, type }) {
      // Tìm ví của user hiện tại
      const wallet = await walletRepo.findOne({ userId }, { model });
      if (!wallet) {
        throw new AppError("Không tìm thấy ví người dùng.", 404, "WALLET_NOT_FOUND");
      }

      // Điều kiện where cơ bản
      const where = { walletId: wallet.walletId };

      // Lọc theo loại giao dịch nếu hợp lệ
      const allowedTypes = ["credit", "debit", "topup"];
      if (type && allowedTypes.includes(type)) {
        where.type = type;
      }

      // Lấy danh sách + tổng count để FE biết còn nữa không
      const [rows, total] = await Promise.all([
        transactionRepo.findAll(where, {
          model,
          limit,
          offset,
          order: [["transactionDate", "DESC"]],
        }),
        model.Transaction.count({ where })
      ]);

      const items = rows.map((tx) => ({
        id: tx.transactionId,
        type: tx.type,
        status: tx.status,
        description: tx.description,
        amount: tx.type === "debit" ? -tx.amount : tx.amount,
        rawAmount: tx.amount, 
        dateISO:
          tx.transactionDate?.toISOString?.() ??
          new Date(tx.transactionDate).toISOString(),
      }));

      return {
        transactions: items,
        total,
      };
    },




  // POST /user/checkin
  async performCheckIn({ userId }) {
    return await sequelize.transaction(async (t) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const todayStr = today.toLocaleDateString("sv-SE"); // YYYY-MM-DD

      // Lấy streak stats của user
      let stats = await checkinRepo.findByUser(userId, { model, transaction: t });

      if (!stats) {
        stats = await checkinRepo.create(
          {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            lastCheckinDate: null,
          },
          { model, transaction: t }
        );
      }

      // Đã checkin hôm nay
      if (stats.lastCheckinDate === todayStr) {
        throw new AppError("Bạn đã điểm danh hôm nay rồi.", 400, "ALREADY_CHECKED");
      }

      // Tính streak mới
      let newCurrentStreak = 1;

      if (stats.lastCheckinDate) {
        const last = new Date(stats.lastCheckinDate + "T00:00:00");
        const diff = (today.getTime() - last.getTime()) / (1000*60*60*24);

        if (diff === 1) newCurrentStreak = stats.currentStreak + 1; 
        else newCurrentStreak = 1; // đứt streak
      }

      const newLongestStreak = Math.max(stats.longestStreak, newCurrentStreak);

      // Cộng vàng
      const wallet = await walletRepo.findOne(
        { userId },
        { model, transaction: t }
      );
      if (!wallet) throw new AppError("Không tìm thấy ví.", 404);

      const reward = 10;
      const newBalance = wallet.balance + reward;

      await walletRepo.updateById(
        wallet.walletId,
        { balance: newBalance },
        { model, transaction: t }
      );

      await transactionRepo.create(
        {
          walletId: wallet.walletId,
          amount: reward,
          description: `Điểm danh hàng ngày - Chuỗi ${newCurrentStreak} ngày`,
          status: "success",
          type: "credit",
        },
        { model, transaction: t }
      );

      // Update streak stats
      await checkinRepo.updateByUser(
        userId,
        {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastCheckinDate: todayStr,
        },
        { model, transaction: t }
      );

      // Build UI 7 ngày
      const CYCLE = 7;
      let filled = newCurrentStreak % CYCLE;
      if (filled === 0) filled = CYCLE;

      const dailyCheckin = [];
      for (let i = 1; i <= CYCLE; i++) {
        dailyCheckin.push({
          day: i,
          checked: i <= filled,
          isToday: i === filled,
        });
      }
      try {
        await updateQuestProgress({
          userId,
          category: "checkin",
        });
      } catch (err) {
        console.error("updateQuestProgress error:", err);
      }
      return {
        message: "Điểm danh thành công!",
        newBalance,
        dailyCheckin,
        dayStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      };
    });
  },




    // GET /user/activity
async getUserActivity({ userId }) {
  const MAX_ITEMS = 5;

// 1) Reading list
const latestRaw = await readingHistoryRepo.findAllLatestPerComic(userId, { model });
// sort theo lastReadAt desc (đề phòng DB không order) rồi lấy 5
const latest = [...latestRaw].sort((a,b) => new Date(b.lastReadAt) - new Date(a.lastReadAt)).slice(0, MAX_ITEMS);
  const readingList = [];
  for (const h of latest) {
    const item = await readingHistoryRepo.findOne(
      {
        where: { userId, comicId: h.comicId, lastReadAt: h.lastReadAt },
        include: [
          { model: model.Comic, attributes: ["comicId","title","coverImage","status","slug"] },
          { model: model.Chapter, attributes: ["chapterNumber"] },
        ],
        // ❌ KHÔNG đưa "model" vào đây
      },
      { model } // ✅ context đúng
    );
    if (!item) continue;

    const comic = item.Comic;
    const chapter = item.Chapter;

    // Đảm bảo kiểu số (max có thể trả '1.00' hoặc null)
    const lastChapterNumberRaw = await chapterRepo.maxChapterNumberByComic(comic.comicId, { model });
    const lastChapterNumber = Number.parseFloat(lastChapterNumberRaw ?? 0) || 0;
    const lastReadChapter   = Number.parseFloat(chapter?.chapterNumber ?? 0) || 0;

    const isCompleted = lastReadChapter === lastChapterNumber;
    const statusText  = isCompleted ? "Hoàn thành" : "Đang đọc";

    // dựng sẵn url cho FE
    const continueUrl = `/truyen-tranh/${comic.slug}/chapter/${lastReadChapter || 1}`;
    const latestUrl   = `/truyen-tranh/${comic.slug}/chapter/${lastChapterNumber || 1}`;
    readingList.push({
      id: comic.comicId,
      cover: comic.coverImage,
      title: comic.title,
      lastReadChapter,
      lastChapterNumber,
      lastReadISO: new Date(item.lastReadAt).toISOString(),
      slug: comic.slug,
      isCompleted,
      continueUrl,
      latestUrl,
      status: statusText,
      });
    }

    // 2) Favorite comics
    const user = await userRepo.findByPk(userId, { model });
    const favoriteComics = user ? await comicFollowRepo.getFollowingComics(user, { limit: MAX_ITEMS }) : [];

    // 3) Comment history (thêm order để chắc chắn là mới nhất)
    const comments = await commentRepo.findAll(
      { userId },
      { model, limit: MAX_ITEMS, order: [["createdAt","DESC"]] }
    );
    const commentHistory = comments.map((c) => ({
      id: c.commentId,
      content: c.content,
      timestampISO: c.createdAt?.toISOString?.() ?? new Date(c.createdAt).toISOString(),
      // từ include Comic & Chapter
      comicTitle: c.Comic?.title,
      comicSlug:  c.Comic?.slug,
      chapterId:  c.Chapter?.chapterId ?? null,
      chapterTitle: c.Chapter?.title ?? null,
      chapterNumber: c.Chapter?.chapterNumber ?? null,
      chapterUrl: (c.Comic?.slug && c.Chapter?.chapterNumber)
        ? `/truyen-tranh/${c.Comic.slug}/chapter/${c.Chapter.chapterNumber}`
        : null,
    }));

    return { readingList, favoriteComics, commentHistory };
    },
    // GET /user/comments?limit=5&offset=5
    async getMyComments({ userId, limit = 5, offset = 0 }) {
      const comments = await commentRepo.findAll(
        { userId },
        { model, limit, offset, order: [["createdAt","DESC"]] }
      );
      return comments.map((c) => ({
        id: c.commentId,
        content: c.content,
        timestampISO: c.createdAt?.toISOString?.() ?? new Date(c.createdAt).toISOString(),
        comicTitle: c.Comic?.title,
        comicSlug:  c.Comic?.slug,
        chapterId:  c.Chapter?.chapterId ?? null,
        chapterTitle: c.Chapter?.title ?? null,
        chapterNumber: c.Chapter?.chapterNumber ?? null,
        chapterUrl: (c.Comic?.slug && c.Chapter?.chapterNumber)
          ? `/comics/${c.Comic.slug}/chapter/${c.Chapter.chapterNumber}`
          : null,
      }));
    },

    // ADMIN: GET /user/admin/users
    async getAllUsers({ page = 1, limit = 10 }) {
      const offset = (page - 1) * limit;
      const { rows, count } = await userRepo.findAndCountAll(
        {
          limit, offset, attributes: [
            "userId","username","email","avatar","role","status","isVerified","lastLogin","createdAt"
          ],
          include: [{ model: model.Wallet, attributes: ["balance"] }],
        },
        { model }
      );
      return { users: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count/limit) } };
    },

    // ADMIN: PUT /user/admin/:userId/:action
    async toggleUserStatus({ userId, action }) {
      const user = await userRepo.findByPk(userId, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 404, "USER_NOT_FOUND");
      if (!["suspend","activate"].includes(action)) throw new AppError("Hành động không hợp lệ", 400, "INVALID_ACTION");

      const status = action === "suspend" ? "suspended" : "active";
      await userRepo.updateById(userId, { status }, { model });
      return { message: `Đã ${action === "suspend" ? "khóa" : "mở khóa"} tài khoản thành công` };
    },

    // ADMIN: PUT /user/admin/:userId/promote
    async promoteToAdmin({ userId }) {
      const user = await userRepo.findByPk(userId, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 404, "USER_NOT_FOUND");
      await userRepo.updateById(userId, { role: "admin" }, { model });
      return { message: "Đã cấp quyền admin thành công" };
    },
  };
};
