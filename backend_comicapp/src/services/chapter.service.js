// app/services/chapter.service.js
const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary"); 

module.exports = ({
  sequelize,
  model,
  repos, // { comicRepo, chapterRepo, chapterImageRepo, chapterUnlockRepo, walletRepo, transactionRepo }
}) => {
  return {
    // GET /:slug/:chapterNumber
    async getChapterDetails({ slug, chapterNumber }) {
      // Lấy comic + danh sách chapter (để tính prev/next)
      const comic = await repos.comicRepo.findOne(
      {
        where: { slug },
        include: [
          {
            model: model.Chapter,
            attributes: ["chapterId", "chapterNumber", "title"],
          },
        ],
        order: [[model.Chapter, "chapterNumber", "ASC"]],
      },
      { model }
    );
      if (!comic) throw new AppError("Không tìm thấy truyện", 404, "COMIC_NOT_FOUND");

      // Tìm chapter cụ thể
      const chapter = await repos.chapterRepo.findOne(
        { comicId: comic.comicId, chapterNumber: parseFloat(chapterNumber) },
        {
          model,
          include: [{
            model: model.ChapterImage,
            attributes: ["imageId", "imageUrl", "pageNumber"],
          }],
          order: [[model.ChapterImage, "pageNumber", "ASC"]],
        }
      );
      if (!chapter) throw new AppError("Không tìm thấy chương", 404, "CHAPTER_NOT_FOUND");

      // Build allChapters + prev/next
      const formatChapterName = (ch) => {
        const num = parseFloat(ch.chapterNumber);
        return `Chương ${Number.isInteger(num) ? num.toFixed(0) : num}${ch.title ? `: ${ch.title}` : ""}`;
      };

      const chapters = [...comic.Chapters].sort(
        (a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber)
      );
      const currentIndex = chapters.findIndex(
        (c) => parseFloat(c.chapterNumber) === parseFloat(chapterNumber)
      );
      const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
      const next = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

      return {
        id: chapter.chapterId,
        comicId: comic.comicId,
        comicTitle: comic.title,
        comicSlug: comic.slug,
        chapterNumber: parseFloat(chapter.chapterNumber),
        chapterTitle: chapter.title || "",
        images: chapter.ChapterImages.map((img) => img.imageUrl),
        allChapters: chapters.map((c) => ({ id: c.chapterId, name: formatChapterName(c) })),
        prevChapterSlug: prev ? `/truyen-tranh/${comic.slug}/chapter/${parseFloat(prev.chapterNumber)}` : null,
        nextChapterSlug: next ? `/truyen-tranh/${comic.slug}/chapter/${parseFloat(next.chapterNumber)}` : null,
        isLocked: chapter.isLocked,
        cost: chapter.cost,
      };
    },

    // GET /:chapterId/check-unlock
    async checkChapterUnlockStatus({ userId, chapterId }) {
      const chapter = await repos.chapterRepo.findById(chapterId, { model });
      if (!chapter) throw new AppError("Chapter không tồn tại", 404, "CHAPTER_NOT_FOUND");

      if (!userId) {
        return { isUnlocked: false, chapterId, message: "Chưa đăng nhập" };
      }

      const existing = await repos.chapterUnlockRepo.findOne({ userId, chapterId }, { model });
      return { isUnlocked: !!existing, chapterId, message: existing ? "Đã mở khóa" : "Chưa mở khóa" };
    },

    // POST /:chapterId/unlock
    async unlockChapter({ userId, chapterId }) {
      const user = await model.User.findByPk(userId);
      const chapter = await repos.chapterRepo.findById(chapterId, { model });
      if (!user || !chapter) throw new AppError("User hoặc Chapter không tồn tại", 404, "NOT_FOUND");

      // ví
      const wallet = await repos.walletRepo.findOne({ userId }, { model });
      if (!wallet) throw new AppError("Không tìm thấy ví của người dùng", 404, "WALLET_NOT_FOUND");

      // kiểm tra đã unlock chưa
      const existing = await repos.chapterUnlockRepo.findOne({ userId, chapterId }, { model });
      if (existing) throw new AppError("Bạn đã mở khóa chương này rồi", 400, "ALREADY_UNLOCKED");

      // giá (giữ backward-compatible: nếu cost null thì =1)
      const amount = chapter.cost ?? 1;
      if ((wallet.balance || 0) < amount) throw new AppError("Không đủ vàng để mở khóa chương", 400, "INSUFFICIENT_BALANCE");

      await sequelize.transaction(async (t) => {
        // trừ vàng
        const newBalance = (wallet.balance || 0) - amount;
        await repos.walletRepo.updateById(wallet.walletId, { balance: newBalance }, { model, transaction: t });

        // tạo unlock
        await repos.chapterUnlockRepo.create({ userId, chapterId }, { model, transaction: t });
        const comicTitle = await repos.comicRepo.getTitleById(chapter.comicId, { model });
        // ghi transaction
        await repos.transactionRepo.create({
          walletId: wallet.walletId,
          chapterId,
          amount,
          status: "success",
          type: "debit",
          description: `Mở khóa chương ${chapter.chapterNumber} của truyệnId ${chapter.comicId}`,
        }, { model, transaction: t });
      });

      return { message: "Mở khóa chương thành công" };
    },

    // PUT /:id
    async updateChapter({ id, title, chapterNumber, cost, isLocked, images }) {
      return await sequelize.transaction(async (t) => {
        const chapter = await repos.chapterRepo.findById(id, { model, transaction: t });
        if (!chapter) throw new AppError("Không tìm thấy chương", 404, "CHAPTER_NOT_FOUND");

        await repos.chapterRepo.updateById(id, { title, chapterNumber, cost, isLocked }, { model, transaction: t });

        // ảnh cũ
        const oldImgs = await repos.chapterImageRepo.findAll(
          { chapterId: id },
          { model, transaction: t }
        );
        const oldMap = new Map(oldImgs.map((img) => [img.imageId, img]));

        if (Array.isArray(images)) {
          for (let i = 0; i < images.length; i++) {
            let { imageId, imageUrl } = images[i];

            // upload base64 lên Cloudinary
            if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
              const upload = await cloudinary.uploader.upload(imageUrl, { folder: "chapters" });
              imageUrl = upload.secure_url;
            }

            if (imageId) {
              await repos.chapterImageRepo.updateById(
                imageId,
                { imageUrl, pageNumber: i + 1 },
                { model, transaction: t }
              );
              oldMap.delete(imageId);
            } else {
              await repos.chapterImageRepo.create(
                { chapterId: id, imageUrl, pageNumber: i + 1 },
                { model, transaction: t }
              );
            }
          }
        }

        // xoá ảnh không còn
        const deleteIds = Array.from(oldMap.keys());
        if (deleteIds.length > 0) {
          await repos.chapterRepo.destroyImagesByIds(deleteIds, { model, transaction: t });
        }

        return { message: "Cập nhật chương thành công" };
      });
    },

    // POST /comics/:comicId/chapters
    async addChapter({ comicId, title, chapterNumber, cost, isLocked, images }) {
      if (!chapterNumber) throw new AppError("Thiếu số chương", 400, "VALIDATION_ERROR");

      // check trùng
      const exists = await repos.chapterRepo.findOne({ comicId, chapterNumber }, { model });
      if (exists) throw new AppError(`Chương ${chapterNumber} đã tồn tại`, 400, "CHAPTER_EXISTS");
      if (!title) title = 'Chương ' + chapterNumber;
      return await sequelize.transaction(async (t) => {
        const chapter = await repos.chapterRepo.create(
          {
            comicId,
            title,
            chapterNumber,
            cost: isLocked ? (cost ?? 1) : 0,
            isLocked: !!isLocked,
          },
          { model, transaction: t }
        );

        // save images
        if (Array.isArray(images) && images.length > 0) {
          const rows = [];
          for (let i = 0; i < images.length; i++) {
            let { imageUrl, pageNumber } = images[i];
            if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
              const upload = await cloudinary.uploader.upload(imageUrl, { folder: "chapters" });
              imageUrl = upload.secure_url;
            }
            rows.push({
              chapterId: chapter.chapterId,
              imageUrl,
              pageNumber: pageNumber || i + 1,
            });
          }
          await repos.chapterImageRepo.bulkCreate(rows, { model, transaction: t });
        }

        // fetch images ordered
        const imgs = await repos.chapterImageRepo.findAll(
          { chapterId: chapter.chapterId },
          { model, order: [["pageNumber", "ASC"]] }
        );

        return { message: "Thêm chương thành công", chapter: { ...chapter.toJSON(), images: imgs } };
      });
    },
  };
};
