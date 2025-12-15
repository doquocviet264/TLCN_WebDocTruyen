
const { Op, literal } = require("sequelize");
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
  async adminFindAndCount(params, { model }) {
  const {
    kw, type, userId, comicId,
    page, limit, sort,
    windowStart, windowEnd,
    reportFilter = "all",
  } = params;

  const whereClause = {};
  if (type) whereClause.type = type;
  if (userId) whereClause.userId = Number(userId);
  if (comicId) whereClause.comicId = Number(comicId);

  if (kw) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${kw}%` } },
      { content: { [Op.like]: `%${kw}%` } },
    ];
  }

  if (windowStart && windowEnd) {
    whereClause.createdAt = { [Op.between]: [windowStart, windowEnd] };
  }

  // ✅ report filter via WHERE EXISTS (không dùng HAVING)
  const reportExists = literal(`
    EXISTS(
      SELECT 1
      FROM reports r
      WHERE r.type = 'post' AND r.targetId = \`Post\`.\`postId\`
    )
  `);

  if (reportFilter === "reported") {
    whereClause[Op.and] = [...(whereClause[Op.and] || []), reportExists];
  } else if (reportFilter === "clean") {
    whereClause[Op.and] = [...(whereClause[Op.and] || []), literal(`NOT ${reportExists.val}`)];
  }

  const offset = (Number(page) - 1) * Number(limit);
  let order = [["createdAt", "DESC"]];
  if (sort === "old") order = [["createdAt", "ASC"]];

  const reportsCountLiteral = literal(`
    (SELECT COUNT(*)
     FROM reports r
     WHERE r.type = 'post' AND r.targetId = \`Post\`.\`postId\`)
  `);

  return model.Post.findAndCountAll({
    where: whereClause,
    distinct: true,
    limit: Number(limit),
    offset,
    order,
    include: [
      { model: model.User, as: "author", attributes: ["userId", "username", "avatar", "email"] },
      { model: model.Comic, as: "comic", attributes: ["comicId", "title", "slug"] },
      { model: model.PostImage, as: "images", attributes: ["postimageId", "imageUrl", "imageNumber"] },
    ],
    attributes: {
      include: [
        [literal(`(SELECT COUNT(*) FROM postlikes pl WHERE pl.postId = \`Post\`.\`postId\`)`), "likesCount"],
        [literal(`(SELECT COUNT(*) FROM postcomments pc WHERE pc.postId = \`Post\`.\`postId\`)`), "commentsCount"],
        [reportsCountLiteral, "reportsCount"],
      ],
    },
  });
},

  async deleteById(postId, { model, transaction }) {
    const id = Number(postId);

    await model.PostLike.destroy({ where: { postId: id }, transaction });
    await model.PostComment.destroy({ where: { postId: id }, transaction });
    await model.PostGenre.destroy({ where: { postId: id }, transaction });
    await model.PostImage.destroy({ where: { postId: id }, transaction });
    await model.Post.destroy({ where: { postId: id }, transaction });

    return true;
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
