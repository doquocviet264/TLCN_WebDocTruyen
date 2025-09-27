const db = require("../models"); // <- thêm dòng này
const { Chapter, User, ChapterUnlock, Transaction, Comic, ChapterImage, Wallet } = db;


// Lấy thông tin chi tiết chương truyện
const getChapterDetails = async (req, res) => {
    try {
        const { slug, chapterNumber } = req.params;
        const formatChapterName = (ch) => {
        const chapterNum = parseFloat(ch.chapterNumber); // Ép kiểu số
        return `Chương ${chapterNum % 1 === 0 ? chapterNum.toFixed(0) : chapterNum}${ch.title ? `: ${ch.title}` : ''}`;
        };

        // Tìm comic theo slug
        const comic = await Comic.findOne({
            where: { slug },
            attributes: ['comicId', 'title', 'slug'],
            include: [
                {
                    model: Chapter,
                    attributes: ['chapterId', 'chapterNumber', 'title'],
                    order: [['chapterNumber', 'ASC']],
                },
            ],
        });

        if (!comic) {
            return res.status(404).json({ message: 'Không tìm thấy truyện' });
        }

        // Tìm chapter cụ thể theo chapterNumber
        const chapter = await Chapter.findOne({
            where: {
                comicId: comic.comicId,
                chapterNumber: parseFloat(chapterNumber),
            },
            attributes: ['chapterId', 'chapterNumber', 'title', 'isLocked', 'cost'],
            include: [
                {
                    model: ChapterImage,
                    attributes: ['imageUrl', 'pageNumber'],
                    order: [['pageNumber', 'ASC']],
                },
            ],
        });

        if (!chapter) {
            return res.status(404).json({ message: 'Không tìm thấy chương' });
        }

        // Lấy danh sách tất cả các chương của comic
        const allChapters = comic.Chapters.map((ch) => ({
            id: ch.chapterId,
            name: formatChapterName(ch),
        }));

        // Tìm chương trước và chương sau
        const chapters = comic.Chapters.sort((a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber));
        const currentIndex = chapters.findIndex((ch) => parseFloat(ch.chapterNumber) === parseFloat(chapterNumber));

        const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
        const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

        const prevChapterSlug = prevChapter
            ? `/truyen-tranh/${comic.slug}/chapter/${parseFloat(prevChapter.chapterNumber)}`
            : null;
        const nextChapterSlug = nextChapter
            ? `/truyen-tranh/${comic.slug}/chapter/${parseFloat(nextChapter.chapterNumber)}`
            : null;

        // Chuẩn bị dữ liệu trả về
        const responseData = {
            id: chapter.chapterId,
            comicId: comic.comicId,
            comicTitle: comic.title,
            comicSlug: comic.slug,
            chapterNumber: parseFloat(chapter.chapterNumber),
            chapterTitle: chapter.title || '',
            images: chapter.ChapterImages.map((img) => img.imageUrl),
            allChapters,
            prevChapterSlug,
            nextChapterSlug,
            isLocked: chapter.isLocked,
            cost: chapter.cost,   
        };

        res.json(responseData);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin chương:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Hàm kiểm tra trạng thái mở khóa chương
const checkChapterUnlockStatus = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null; // Có thể là null nếu không đăng nhập
    const { chapterId } = req.params;

    // Lấy thông tin chapter
    const chapter = await Chapter.findByPk(chapterId);
    if (!chapter) {
      return res.status(404).json({ msg: "Chapter không tồn tại" });
    }

    // Nếu không đăng nhập, trả về trạng thái mặc định
    if (!userId) {
      return res.json({ 
        isUnlocked: false,
        chapterId: chapterId,
        message: "Chưa đăng nhập"
      });
    }

    // Kiểm tra nếu chapter đã unlock
    const existingUnlock = await ChapterUnlock.findOne({
      where: { userId, chapterId },
    });

    return res.json({ 
      isUnlocked: !!existingUnlock,
      chapterId: chapterId,
      message: existingUnlock ? "Đã mở khóa" : "Chưa mở khóa"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Lỗi server" });
  }
};
const unlockChapter = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chapterId } = req.params;

    // Lấy thông tin user và chapter
    const user = await User.findByPk(userId);
    const chapter = await Chapter.findByPk(chapterId);

    if (!user || !chapter) {
      return res.status(404).json({ msg: "User hoặc Chapter không tồn tại" });
    }

    // Lấy ví của user
    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ msg: "Không tìm thấy ví của người dùng" });
    }

    // Kiểm tra nếu chapter đã unlock
    const existingUnlock = await ChapterUnlock.findOne({
      where: { userId, chapterId },
    });
    if (existingUnlock) {
      return res.status(400).json({ msg: "Bạn đã mở khóa chương này rồi" });
    }

    // Kiểm tra số vàng trong ví
    if (wallet.balance < 1) {
      return res.status(400).json({ msg: "Không đủ vàng để mở khóa chương" });
    }

    // Transaction DB
    await db.sequelize.transaction(async (t) => {
      // Trừ vàng trong ví
      wallet.balance -= 1;
      await wallet.save({ transaction: t });

      // Tạo ChapterUnlock
      await ChapterUnlock.create(
        { userId, chapterId },
        { transaction: t }
      );

      // Tạo Transaction
      await Transaction.create(
        {
          walletId: wallet.walletId,
          chapterId,
          amount: 1,
          status: "success",
        },
        { transaction: t }
      );
    });

    return res.json({ msg: "Mở khóa chương thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Lỗi server" });
  }
};


module.exports = {
  unlockChapter,
  getChapterDetails,
  checkChapterUnlockStatus
};
