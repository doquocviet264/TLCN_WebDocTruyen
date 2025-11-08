// Community Post Repository - DI: { model } bắt buộc

module.exports = {
  async create(data, { model, transaction } = {}) {
    return model.Post.create(data, { transaction });
  },

  async findById(postId, { model, include, currentUserId = null } = {}) {
    const { Sequelize } = model.Sequelize;
    const includeDefault = [
      { model: model.Genre, as: "genres", through: { attributes: [] }, required: false },
      { model: model.PostImage, as: "images", required: false },
      { model: model.User, as: "author", attributes: ["userId", "username", "avatar"] },
      { model: model.Comic, as: "comic" },
    ];

    const attributes = {};
    if (currentUserId) {
      attributes.include = [
        [
          Sequelize.literal(`EXISTS(SELECT 1 FROM postlikes WHERE postId = Post.postId AND userId = ${currentUserId})`),
          "hasLiked",
        ],
      ];
    }

    return model.Post.findByPk(postId, { include: include || includeDefault, attributes });
  },

  async bulkAttachGenres(postId, genreIds = [], { model, transaction } = {}) {
    if (!genreIds?.length) return [];
    const rows = genreIds.map((gid) => ({ postId, genreId: gid }));
    return model.PostGenre.bulkCreate(rows, { ignoreDuplicates: true, transaction });
  },

  async bulkAddImages(postId, images = [], { model, transaction } = {}) {
    if (!images?.length) return [];
    const rows = images.map((img) => ({
      postId,
      imageUrl: img.imageUrl,
      imageNumber: img.imageNumber ?? 0,
    }));
    return model.PostImage.bulkCreate(rows, { transaction });
  },

  async findAndCount(params = {}, { model } = {}) {
    const { Sequelize, Op } = model.Sequelize;
    const {
      kw, type, userId, comicId, currentUserId,
      genreIdList = [], genreMode = "any",
      minAvgRating, sort = "new",
      windowStart = null, windowEnd = null,
      limit = 12, page = 1,
    } = params;

    const where = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (comicId) where.comicId = comicId;
    if (kw) {
      where[Op.or] = [
        { title:   { [Op.like]: `%${kw}%` } },
        { content: { [Op.like]: `%${kw}%` } },
      ];
    }

    const avgRatingExpr = Sequelize.literal(
      "(CASE WHEN Post.type='review' " +
      "THEN ROUND((IFNULL(ratingStoryLine,0)+IFNULL(ratingCharacters,0)+IFNULL(ratingArt,0)+IFNULL(ratingEmotion,0)+IFNULL(ratingCreativity,0))/5,2) " +
      "ELSE NULL END)"
    );

    const commentsCountExpr = Sequelize.literal(
      `(SELECT COUNT(*) FROM postcomments pc WHERE pc.postId = Post.postId)`
    );

    const likesCountExpr = Sequelize.literal(
      windowStart && windowEnd
        ? `(SELECT COUNT(*) FROM postlikes pl
              WHERE pl.postId = Post.postId
                AND pl.createdAt BETWEEN '${windowStart}' AND '${windowEnd}')`
        : `(SELECT COUNT(*) FROM postlikes pl WHERE pl.postId = Post.postId)`
    );

    const include = [
      { model: model.Genre, as: "genres", through: { attributes: [] }, required: false },
      { model: model.PostImage, as: "images", required: false },
      { model: model.User, as: "author", attributes: ["userId", "username", "avatar"] },
      { model: model.Comic, as: "comic" },
    ];

    if (genreIdList.length) {
      include[0].where = { genreId: { [Op.in]: genreIdList } };
      include[0].required = true; // khớp ít nhất 1 genre
    }

    const attributes = {
      include: [
        [avgRatingExpr, "avgRating"],
        [likesCountExpr, "likesCount"],
        [commentsCountExpr, "commentsCount"],
      ],
    };

    if (currentUserId) {
      attributes.include.push([
        Sequelize.literal(`EXISTS(SELECT 1 FROM postlikes WHERE postId = Post.postId AND userId = ${currentUserId})`),
        "hasLiked",
      ]);
    }

    const having = {};
    if (minAvgRating) {
      having[Sequelize.col("avgRating")] = { [Op.gte]: Number(minAvgRating) };
    }

    let group;
    if (genreIdList.length && genreMode === "all") {
      group = ["Post.postId"];
      having[Sequelize.literal("COUNT(DISTINCT `genres`.`genreId`)")] = genreIdList.length;
    }

    let order = [["createdAt", "DESC"]];
    if (sort === "old") order = [["createdAt", "ASC"]];
    else if (sort === "top")
      order = [[Sequelize.literal("avgRating IS NULL, avgRating"), "DESC"], ["createdAt", "DESC"]];
    else if (sort === "hot")
      order = [[Sequelize.literal("likesCount"), "DESC"], ["createdAt", "DESC"]];

    const limitNum = Number(limit) || 12;
    const pageNum = Number(page) || 1;
    const offset = (pageNum - 1) * limitNum;

    return model.Post.findAndCountAll({
      where,
      include,
      attributes,
      subQuery: false,
      ...(group ? { group } : {}),
      ...(Object.keys(having).length ? { having } : {}),
      order,
      offset,
      limit: limitNum,
      distinct: !group,
    });
  },
};
