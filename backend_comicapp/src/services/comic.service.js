const AppError = require("../utils/AppError");
const cloudinary = require("../config/cloudinary");
const { slugify } = require("transliteration");

module.exports = ({ sequelize, model, repos }) => {
  const { Op, fn, col, literal } = model.Sequelize;
  const {
    comicRepo, chapterRepo, genreRepo, altNameRepo, userRepo,
  } = repos;

  // ---- helpers ----
  async function generateUniqueSlug(title) {
    let base = slugify(title, { lowercase: true, separator: "-" });
    let slug = base, i = 1;
    while (await model.Comic.findOne({ where: { slug } })) slug = `${base}-${i++}`;
    return slug;
  }
  async function processImage(image, oldImage) {
    let cover = oldImage || null;
    if (!image) return cover;
    if (image.startsWith("data:")) {
      const up = await cloudinary.uploader.upload(image, { folder: "comics" });
      cover = up.secure_url;
    } else if (image.startsWith("http")) cover = image;
    return cover;
  }
  const addRank = (rows) =>
  rows.map((row, i) => {
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    return { ...plain, rank: i + 1 };
  });

  return {
    // Cho người dùng
    async getComicDetails({ slug, userId }) {
      const comic = await comicRepo.findOne(
        {
            where: { slug },
            attributes: [
            "comicId", "title", "slug", "author", "status", "description",
            [literal("coverImage"), "image"],
            [literal("updatedAt"), "lastUpdate"],
            ],
            include: [
            { model: model.Genre, attributes: ["name"], through: { attributes: [] } },
            {
                model: model.Chapter,
                attributes: ["chapterId","chapterNumber","title","views","isLocked","updatedAt"],
                separate: true,
                order: [["chapterNumber", "DESC"]],
            },
            ],
            // transaction: t,
        },
        { model }
        );
      if (!comic) throw new AppError("Không tìm thấy truyện", 404, "COMIC_NOT_FOUND");

      // followers/likers/ratings
      const [followers, likers, ratings] = await Promise.all([
        comic.getFollowers({ attributes: ["userId"] }),
        comic.getLikers({ attributes: ["userId"] }),
        comic.getComicRatings({ attributes: ["score"] }),
      ]);
      const followerCount = followers.length;
      const likerCount = likers.length;
      const isFollowing = !!(userId && followers.some(f => f.userId === userId));
      const isFavorite  = !!(userId && likers.some(f => f.userId === userId));
      const totalScore  = ratings.reduce((s, r) => s + (r.score || 0), 0);
      const rating = ratings.length ? +(totalScore / ratings.length).toFixed(1) : 0;

      return {
        id: comic.comicId,
        slug: comic.slug,
        title: comic.title,
        author: comic.author,
        image: comic.get("image"),
        lastUpdate: comic.get("lastUpdate"),
        status: comic.status,
        description: comic.description,
        genres: comic.Genres.map(g => g.name),
        rating,
        reviewCount: ratings.length,
        followers: followerCount,
        isFollowing,
        likers: likerCount,
        isFavorite,
        chapters: comic.Chapters.map(c => ({
          id: c.chapterId,
          number: c.chapterNumber,
          title: c.title,
          views: c.views,
          isLocked: c.isLocked,
          time: c.updatedAt,
        })),
      };
    },

    async toggleFollow({ slug, userId }) {
      const comic = await model.Comic.findOne({
        where: { slug },
        include: [{ model: model.User, as: "Followers", attributes: ["userId"] }],
      });
      if (!comic) throw new AppError("Không tìm thấy truyện", 404, "COMIC_NOT_FOUND");

      const isFollowing = comic.Followers.some(f => f.userId === userId);
      if (isFollowing) {
        await comic.removeFollower(userId);
        return { message: "Hủy theo dõi thành công", isFollowing: false };
      } else {
        await comic.addFollower(userId);
        return { message: "Theo dõi thành công", isFollowing: true };
      }
    },

    async toggleLike({ slug, userId }) {
      const comic = await model.Comic.findOne({
        where: { slug },
        include: [{ model: model.User, as: "Likers", attributes: ["userId"] }],
      });
      if (!comic) throw new AppError("Không tìm thấy truyện", 404, "COMIC_NOT_FOUND");

      const isFavorite = comic.Likers.some(u => u.userId === userId);
      if (isFavorite) {
        await comic.removeLiker(userId);
        return { message: "Hủy thích thành công", isFavorite: false };
      } else {
        await comic.addLiker(userId);
        return { message: "Thích thành công", isFavorite: true };
      }
    },

    async getNewlyUpdatedComics() {
      const comics = await comicRepo.findNewLyUpdatedComic({ limit: 24 }, { model});
      return comics;
    },

    async getFeaturedComics() {
      const comics = await comicRepo.findFeaturedComic({limit: 10}, { model});
      return comics;
    },

    async getRankings() {
      const base = (orderByField) => comicRepo.findRankComic({limit: 10, orderByField}, { model});

      const [topComics, favoriteComics, newComics] = await Promise.all([
        base("views"), base("followerCount"), base("createdAt"),
      ]);
      return { top: addRank(topComics), favorites: addRank(favoriteComics), new: addRank(newComics) };
    },

    async getHomepageSections() {
      const limit = 10;
      const fetchComicsForSection = async (options = {}) => {
        const comics = await model.Comic.findAll({
          limit,
          attributes: ["comicId","title","slug","coverImage"],
          include: [{
            model: model.Chapter,
            attributes: ["chapterNumber"],
            order: [["chapterNumber","DESC"]],
            limit: 1,
            separate: true,
          }],
          ...options,
        });
        return comics.map(c => ({
          id: c.comicId, title: c.title, slug: c.slug, image: c.coverImage,
          lastChapter: c.Chapters?.[0]?.chapterNumber ?? null,
        }));
      };

      const randomGenres = await genreRepo.random(3, { model });
      const genreSectionsPromises = randomGenres.map(g =>
        fetchComicsForSection({
          include: [
            { model: model.Chapter, attributes: ["chapterNumber"], order: [["chapterNumber","DESC"]], limit: 1, separate: true },
            { model: model.Genre, where: { genreId: g.genreId }, attributes: [],through: { attributes: [] }},
          ],
        }).then(comics => ({ genre: g, comics }))
      );

      const completedSectionPromise = fetchComicsForSection({
        where: { status: "Completed" }, order: [["updatedAt","DESC"]],
      }).then(comics => ({ title: "Truyện Đã Hoàn Thành", comics }));

      const randomSectionPromise = fetchComicsForSection({
        order: model.sequelize.random(),
      }).then(comics => ({ title: "Gợi Ý Ngẫu Nhiên", comics }));

      const [genreSections, completedSection, randomSection] = await Promise.all([
        Promise.all(genreSectionsPromises), completedSectionPromise, randomSectionPromise,
      ]);
      return { genreSections, completedSection, randomSection };
    },

    async getComicDetailForHistory({ comicId }) {
      const comic = await comicRepo.findOne(
        {
            where: { comicId },
            attributes: ["title", "slug", [literal("coverImage"), "image"]],
        },
        { model }
        );
      if (!comic) throw new AppError("Không tìm thấy truyện", 404, "COMIC_NOT_FOUND");
      return { slug: comic.slug, title: comic.title, image: comic.get("image") };
    },

    async searchComics({ q = "", genres = "", status = "all", country = "all", sortBy = "newest", page = 1, limit = 40 }) {
      const where = {};
      const statusMap = { "Đang cập nhật": "In Progress", "Tạm ngưng": "On Hold", "Hoàn thành": "Completed" };
      if (q) where[Op.or] = [{ title: { [Op.like]: `%${q}%` } }, { author: { [Op.like]: `%${q}%` } }];
      if (status !== "all" && statusMap[status]) where.status = statusMap[status];

      // genres filter
      let genreFilter = genres ? genres.split(",").map(s => s.trim()) : [];
      const countryGenres = { "nhat-ban": "Manga", "han-quoc": "Manhwa", "trung-quoc": "Manhua", "my": "Comic", "viet-nam": "Việt Nam" };
      if (country !== "all" && countryGenres[country]) genreFilter.push(countryGenres[country]);

      let order = [["createdAt","DESC"]];
      switch (sortBy) {
        case "rating": order = [[literal("rating"), "DESC"]]; break;
        case "oldest": order = [["createdAt","ASC"]]; break;
        case "popular": order = [[literal("chapters"), "DESC"]]; break;
      }
      const offset = (page - 1) * limit;

      // find comic ids that match ALL required genres
      if (genreFilter.length > 0) {
        const genreResults = await model.Comic.findAll({
          include: [{ model: model.Genre, where: { name: { [Op.in]: genreFilter } }, through: { attributes: [] }, attributes: [] }],
          attributes: ["comicId"],
          group: ["Comic.comicId"],
          having: sequelize.where(fn("COUNT", col("Genres.genreId")), { [Op.gte]: genreFilter.length }),
          raw: true,
        });
        const ids = genreResults.map(r => r.comicId);
        if (ids.length === 0) {
          return { comics: [], totalComics: 0, totalPages: 0, currentPage: +page };
        }
        where.comicId = { [Op.in]: ids };
      }

      const { count, rows } = await comicRepo.findAndCountAll(
        {
          where,
          include: [
            { model: model.Genre, through: { attributes: [] }, attributes: ["name"] },
            { model: model.Chapter, attributes: ["chapterNumber"], order: [["chapterNumber","DESC"]], limit: 1, separate: true },
          ],
          attributes: {
            include: [
              [literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "rating"],
              [literal("(SELECT COUNT(*) FROM Chapters WHERE Chapters.comicId = Comic.comicId)"), "chapters"],
            ],
          },
          order,
          limit: +limit,
          offset: +offset,
          distinct: true,
        },
        { model }
      );

      const comics = rows.map(c => ({
        id: c.comicId, slug: c.slug, title: c.title, image: c.coverImage,
        lastChapter: c.Chapters[0]?.chapterNumber ?? null,
      }));
      return { comics, totalComics: count, totalPages: Math.ceil(count / limit), currentPage: +page };
    },

    async getFollowedComics({ userId }) {
      const user = await userRepo.findByPk(userId, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng.", 404, "USER_NOT_FOUND");

      const followed = await user.getFollowingComics({
        attributes: [
          ["comicId","id"], "title","slug", ["coverImage","image"],
          [literal(`
            COALESCE(
              (SELECT ch.chapterNumber 
               FROM ReadingHistory rh 
               JOIN Chapters ch ON rh.chapterId = ch.chapterId 
               WHERE rh.userId = ${userId} AND rh.comicId = \`ComicFollows\`.\`comicId\` 
               ORDER BY rh.lastReadAt DESC 
               LIMIT 1),
              (SELECT MIN(ch2.chapterNumber) FROM Chapters ch2 WHERE ch2.comicId = \`ComicFollows\`.\`comicId\`)
            )
          `),"lastChapter"],
        ],
        joinTableAttributes: [],
        order: [[literal("`ComicFollows`.`followDate`"), "DESC"]],
      });

      return followed.map(c => {
        const p = c.get({ plain: true });
        const lastNumber = p.lastChapter || "1";
        return { id: p.id, title: p.title, slug: p.slug, image: p.image, lastChapter: lastNumber, chapterTitle: `Chương ${lastNumber}` };
      });
    },

    async getRelatedComics({ slug, limit = 12 }) {
    const current = await comicRepo.findOne(
    {
        where: { slug },
        include: [
        { model: model.Genre, attributes: ["genreId"], through: { attributes: [] } },
        ],
        // transaction: t,
    },
    { model }
    );
      if (!current) throw new AppError("Không tìm thấy truyện", 404, "COMIC_NOT_FOUND");

      const ids = current.Genres.map(g => g.genreId);
      if (ids.length === 0) return [];

      const related = await comicRepo.findAll(
        {
          where: { comicId: { [Op.ne]: current.comicId } },
          include: [
            { model: model.Genre, where: { genreId: { [Op.in]: ids } }, through: { attributes: [] }, attributes: [] },
          ],
          attributes: [
            "comicId","title","slug","updatedAt",
            [col("coverImage"), "image"],
            [literal("(SELECT SUM(c.views) FROM Chapters c WHERE c.comicId = Comic.comicId)"), "totalViews"],
            [literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "rating"],
            [literal("(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"), "followerCount"],
            [literal("(SELECT c.chapterNumber FROM Chapters c WHERE c.comicId = Comic.comicId ORDER BY c.chapterNumber DESC LIMIT 1)"), "latestChapter"],
          ],
          order: [
            [literal(`(
              SELECT COUNT(*) FROM GenreComic 
              WHERE GenreComic.comicId = Comic.comicId 
              AND GenreComic.genreId IN (${ids.join(",")})
            )`),"DESC"],
            [literal("rating"), "DESC"],
            [literal("followerCount"), "DESC"],
          ],
          limit,
        },
        { model }
      );

      return related.map(c => ({
        id: c.comicId, title: c.title, slug: c.slug, image: c.get("image"),
        views: parseInt(c.get("totalViews")) || 0,
        rating: c.get("rating") ? +(+c.get("rating")).toFixed(1) : 0,
        lastChapter: c.get("latestChapter") ? +(+c.get("latestChapter")).toFixed(1) : 0,
        latestChapterTime: c.updatedAt,
      }));
    },

    // ========== Admin ==========
    async getComicsForAdmin({ page = 1, limit = 30 }) {
      const offset = (page - 1) * limit;
      const { count, rows } = await comicRepo.findAndCountAll(
        {
          include: [
            { model: model.Genre, attributes: ["name"], through: { attributes: [] } },
            { model: model.AlternateName, as: "AlternateNames", attributes: ["name"] },
          ],
          attributes: {
            include: [
              [literal("(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"), "followerCount"],
              [literal("(SELECT SUM(views) FROM Chapters WHERE Chapters.comicId = Comic.comicId)"), "totalViews"],
              [literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "avgRating"],
            ],
          },
          order: [["updatedAt","DESC"]],
          limit, offset, distinct: true,
        },
        { model }
      );

      const comics = rows.map(c => ({
        id: c.comicId, title: c.title, slug: c.slug, author: c.author, image: c.coverImage,
        status: c.status,
        genres: c.Genres.map(g => g.name),
        aliases: c.AlternateNames.map(a => a.name),
        description: c.description,
        followers: parseInt(c.get("followerCount")) || 0,
        views: parseInt(c.get("totalViews")) || 0,
        rating: c.get("avgRating") ? +(+c.get("avgRating")).toFixed(1) : 0,
        updatedAt: c.updatedAt, createdAt: c.createdAt,
      }));

      return { comics, meta: { page, limit, total: count, totalPages: Math.ceil(count/limit) } };
    },

    async getComicByIdForAdmin({ id }) {
      const comic = await comicRepo.findByPk(
        id,
        {
            include: [
            { model: model.Genre, attributes: ["name"], through: { attributes: [] } },
            { model: model.AlternateName, attributes: ["name"] },
            {
                model: model.Chapter,
                attributes: [
                "chapterId","chapterNumber","title","cost","isLocked","views","updatedAt","createdAt"
                ],
                include: [
                { model: model.ChapterImage, attributes: ["imageId","imageUrl","pageNumber"] }
                ],
                // Sắp xếp ảnh theo pageNumber ASC (order lồng đúng chuẩn)
                order: [[{ model: model.ChapterImage, as: "ChapterImages" }, "pageNumber", "ASC"]],
            },
            ],
            attributes: {
            include: [
                [literal("(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"), "followerCount"],
                [literal("(SELECT SUM(views) FROM Chapters WHERE Chapters.comicId = Comic.comicId)"), "totalViews"],
                [literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "avgRating"],
            ],
            },
        },
        { model }
        );
      if (!comic) throw new AppError("Không tìm thấy comic", 404, "COMIC_NOT_FOUND");

      return {
        id: comic.comicId, title: comic.title, slug: comic.slug, author: comic.author,
        image: comic.coverImage, status: comic.status, description: comic.description,
        genres: comic.Genres.map(g => g.name),
        aliases: comic.AlternateNames.map(a => a.name),
        followers: parseInt(comic.get("followerCount")) || 0,
        views: parseInt(comic.get("totalViews")) || 0,
        rating: comic.get("avgRating") ? +(+comic.get("avgRating")).toFixed(1) : 0,
        createdAt: comic.createdAt, updatedAt: comic.updatedAt,
        chapters: comic.Chapters.map(ch => ({
          id: ch.chapterId, number: ch.chapterNumber, title: ch.title, views: ch.views,
          cost: ch.cost, isLocked: ch.isLocked, publishDate: ch.createdAt, updatedAt: ch.updatedAt,
          images: ch.ChapterImages?.map(im => ({ id: im.imageId, url: im.imageUrl, pageNumber: im.pageNumber })) ?? [],
        })),
      };
    },

    async updateComic({ id, payload }) {
      return await sequelize.transaction(async (t) => {
        const { title, author, status, description, image, genres, aliases } = payload;
        const comic = await comicRepo.findByPk(id, {},{ model, transaction: t });
        if (!comic) throw new AppError("Không tìm thấy comic", 404, "COMIC_NOT_FOUND");

        const coverImageUrl = await processImage(image, comic.coverImage);
        await comic.update({ title, author, status, description, coverImage: coverImageUrl }, { transaction: t });

        if (Array.isArray(genres)) {
          const records = await genreRepo.findAll(
            { where: { name: { [Op.in]: genres } }, transaction: t },
            { model }
            );
          await comic.setGenres(records, { transaction: t });
        }

        if (Array.isArray(aliases)) {
          const old = await altNameRepo.findAll({ comicId: id }, { model, transaction: t });
          const oldNames = old.map(a => a.name);
          const newNames = aliases;

          const toDelete = oldNames.filter(n => !newNames.includes(n));
          if (toDelete.length) await altNameRepo.destroy({ comicId: id, name: toDelete }, { model, transaction: t });

          const toAdd = newNames.filter(n => !oldNames.includes(n));
          if (toAdd.length) await altNameRepo.bulkCreate(toAdd.map(name => ({ comicId: id, name })), { model, transaction: t });
        }

        const updated = await comicRepo.findByPk(
        id,
        {
            include: [
            { model: model.Genre, attributes: ["name"], through: { attributes: [] } },
            { model: model.AlternateName, attributes: ["name"] },
            ],
        },
        { model }
        );
        return { message: "Cập nhật comic thành công", comic: updated };
      });
    },

    async addComic({ body }) {
      return await sequelize.transaction(async (t) => {
        const { title, author, status, description, image, genres = [], aliases = [] } = body;

        if (!genres.length) throw new AppError("Truyện phải có ít nhất một thể loại", 400, "VALIDATION_ERROR");
        if (!description?.trim()) throw new AppError("Mô tả truyện không được để trống", 400, "VALIDATION_ERROR");
        if (!title?.trim()) throw new AppError("Tiêu đề truyện không được để trống", 400, "VALIDATION_ERROR");

        const existed = await model.Comic.findOne({ where: { title } });
        if (existed) throw new AppError("Tên truyện đã tồn tại", 400, "DUPLICATE_TITLE");

        const slug = await generateUniqueSlug(title);
        const coverImageUrl = await processImage(image, null);

        const comic = await comicRepo.create(
          { title, author: author || "Đang cập nhật", status, description, coverImage: coverImageUrl, slug },
          { model, transaction: t }
        );

        if (genres.length) {
          const genreRecords = await genreRepo.findAll(
            { where: { name: { [Op.in]: genres } }, transaction: t },
            { model }
            );
          await comic.setGenres(genreRecords, { transaction: t });
        }
        if (aliases.length) {
          await altNameRepo.bulkCreate(aliases.map(name => ({ comicId: comic.comicId, name })), { model, transaction: t });
        }

        const newComic = await comicRepo.findByPk(
        comic.comicId,
        {
            include: [
            { model: model.Genre, attributes: ["name"], through: { attributes: [] } },
            { model: model.AlternateName, attributes: ["name"] },
            ],
        },
        { model }
        );

        return { message: "Thêm comic thành công", comic: newComic };
      });
    },
    async deleteComic({ id }) {
    return sequelize.transaction(async (t) => {
      const { Op } = model.Sequelize;

      const comic = await model.Comic.findByPk(id, { transaction: t });
      if (!comic) throw new AppError("Không tìm thấy comic", 404, "COMIC_NOT_FOUND");

      // Xóa ảnh bìa Cloudinary (không chặn flow nếu fail)
      const coverUrl = comic.coverImage;
      if (coverUrl && /res\.cloudinary\.com/.test(coverUrl)) {
        const publicId = getCloudinaryPublicId(coverUrl);
        if (publicId) {
          cloudinary.uploader.destroy(publicId).catch(() => {}); // không throw, tránh ảnh hưởng TX
        }
      }

      // Gom dữ liệu liên quan
      const chapters = await model.Chapter.findAll({
        where: { comicId: id }, attributes: ["chapterId"], transaction: t,
      });
      const chapterIds = chapters.map(c => c.chapterId);

      const comments = await model.Comment.findAll({
        where: { comicId: id }, attributes: ["commentId"], transaction: t,
      });
      const commentIds = comments.map(c => c.commentId);

      // Xóa phụ thuộc
      if (chapterIds.length) {
        await Promise.all([
          model.ChapterImage.destroy({ where: { chapterId: { [Op.in]: chapterIds } }, transaction: t }),
          model.ChapterUnlock.destroy({ where: { chapterId: { [Op.in]: chapterIds } }, transaction: t }),
          model.Transaction.destroy({ where: { chapterId: { [Op.in]: chapterIds } }, transaction: t }),
        ]);
      }

      if (commentIds.length) {
        await model.CommentLikes.destroy({ where: { commentId: { [Op.in]: commentIds } }, transaction: t });
      }

      await Promise.all([
        model.Comment.destroy({ where: { comicId: id }, transaction: t }),
        model.ReadingHistory.destroy({ where: { comicId: id }, transaction: t }),
        model.ComicRating.destroy({ where: { comicId: id }, transaction: t }),
        model.ComicFollow.destroy({ where: { comicId: id }, transaction: t }),
        model.ComicLike.destroy({ where: { comicId: id }, transaction: t }),
        model.AlternateName.destroy({ where: { comicId: id }, transaction: t }),
      ]);

      // Bỏ liên kết thể loại (through)
      await comic.setGenres([], { transaction: t });

      if (chapterIds.length) {
        await model.Chapter.destroy({ where: { chapterId: { [Op.in]: chapterIds } }, transaction: t });
      }

      await comic.destroy({ transaction: t });

      return { message: "Xóa comic thành công" };
    });

    function getCloudinaryPublicId(url) {
      try {
        const path = new URL(url).pathname; // /image/upload/v123/comics/abc.jpg
        const afterUpload = path.split("/upload/")[1];
        if (!afterUpload) return null;
        const noVer = afterUpload.replace(/^v\d+\//, "");
        return noVer.replace(/\.[a-zA-Z0-9]+$/, ""); // comics/abc
      } catch { return null; }
    }
  },

  };
};
