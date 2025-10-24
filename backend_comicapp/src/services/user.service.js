// app/services/user.service.js
const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary"); 

module.exports = ({ sequelize, model, repos }) => {
  const {
    userRepo, walletRepo, transactionRepo, checkinRepo,
    readingHistoryRepo, commentRepo, comicFollowRepo, comicRepo, chapterRepo
  } = repos;
  const { Sequelize } = model;

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
      if (!wallet) throw new AppError("Không tìm thấy ví của người dùng.", 404, "WALLET_NOT_FOUND");

      const transactions = await transactionRepo.findAll(
        { walletId: wallet.walletId },
        { model, limit: 20, order: [["transactionDate","DESC"]] }
      );

      const transactionHistory = transactions.map((tx) => ({
        id: tx.transactionId,
        description: tx.description || "Giao dịch",
        amount: tx.type === "debit" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
        date: new Date(tx.transactionDate).toLocaleDateString("vi-VN"),
      }));

      // lấy checkin gần nhất
      let lastCheckin = await checkinRepo.findLastByUser(userId, { model });

      const today = new Date(); today.setHours(0,0,0,0);

      // Nếu đã day=7 và không phải hôm nay → reset
      if (lastCheckin && lastCheckin.day === 7) {
        const d = new Date(lastCheckin.createdAt); d.setHours(0,0,0,0);
        if (d.getTime() !== today.getTime()) {
          await checkinRepo.destroy({ userId }, { model });
          lastCheckin = null;
        }
      }

      const dailyCheckin = [];
      let lastDay = 0;
      let lastDate = null;

      if (lastCheckin) {
        lastDay = lastCheckin.day;
        lastDate = new Date(lastCheckin.createdAt); lastDate.setHours(0,0,0,0);
      }

      for (let i = 1; i <= 7; i++) {
        let checked = i <= lastDay;
        let isToday = false;

        if (checked && lastDate) {
          isToday = lastDate.getTime() === today.getTime();
        } else if (!checked) {
          if (!lastDate || lastDate.getTime() < today.getTime()) {
            isToday = i === lastDay + 1;
          }
        }
        dailyCheckin.push({ day: i, checked, isToday });
      }

      return { transactionHistory, dailyCheckin };
    },

    // POST /user/checkin
    async performCheckIn({ userId }) {
      return await sequelize.transaction(async (t) => {
        const today = new Date(); today.setHours(0,0,0,0);

        const lastCheckin = await checkinRepo.findLastByUser(userId, { model });
        if (lastCheckin) {
          const d = new Date(lastCheckin.createdAt); d.setHours(0,0,0,0);
          if (d.getTime() === today.getTime()) {
            throw new AppError("Bạn đã điểm danh hôm nay rồi.", 400, "ALREADY_CHECKED");
          }
        }

        const wallet = await walletRepo.findOne({ userId }, { model, transaction: t });
        if (!wallet) throw new AppError("Không tìm thấy ví.", 404, "WALLET_NOT_FOUND");

        const nextDay = lastCheckin ? (lastCheckin.day === 7 ? 1 : lastCheckin.day + 1) : 1;
        const reward = 10;

        await checkinRepo.create({ userId, day: nextDay }, { model, transaction: t });

        const newBalance = (wallet.balance || 0) + reward;
        await walletRepo.updateById(wallet.walletId, { balance: newBalance }, { model, transaction: t });

        await transactionRepo.create({
          walletId: wallet.walletId,
          amount: reward,
          description: `Điểm danh hàng ngày - Ngày ${nextDay}`,
          status: "success",
          type: "credit",
        }, { model, transaction: t });

        const dailyCheckin = [];
        for (let i = 1; i <= 7; i++) {
          dailyCheckin.push({ day: i, checked: i <= nextDay, isToday: i === nextDay });
        }

        return { message: "Điểm danh thành công!", newBalance, dailyCheckin };
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
