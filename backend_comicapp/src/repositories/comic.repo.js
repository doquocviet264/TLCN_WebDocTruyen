// app/repositories/comic.repo.js
const { col, literal } = require('sequelize');
module.exports = {
  findOne(options = {}, { model } = {}) {
    return model.Comic.findOne(options);
  },
  findByPk(id, options = {}, { model } = {}) {
    return model.Comic.findByPk(id, options);
  },
  findAll(options = {}, { model } = {}) {
    return model.Comic.findAll(options);
  },
  findNewLyUpdatedComic({ limit }, { model } = {}){
    return model.Comic.findAll({
      limit,
      order: [['updatedAt', 'DESC']],
      attributes: [
        [col("Comic.comicId"), "id"], "title","slug","author", [col("coverImage"), "image"],
        [literal("(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"), "hearts"],
        [literal("(SELECT COUNT(*) FROM Comments WHERE Comments.comicId = Comic.comicId)"), "comments"],
        [literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "rating"],
      ],
      include: [{
        model: model.Chapter,
        attributes: ["chapterNumber", ["updatedAt","time"]],
        order: [["chapterNumber","DESC"]],
        limit: 3,
        separate: true,
      }],
    });
  },
  findFeaturedComic({ limit }, { model } = {}){
    return model.Comic.findAll({
      limit,
      attributes: [
        [col("Comic.comicId"), "id"],"title","slug", [col("coverImage"), "image"],
        [literal("(SELECT COUNT(*) FROM ComicLikes WHERE ComicLikes.comicId = Comic.comicId)"), "likeCount"],
        [literal("(SELECT c.chapterNumber FROM Chapters c WHERE c.comicId = Comic.comicId ORDER BY c.chapterNumber DESC LIMIT 1)"), "latestChapter"],
      ],
      order: [[literal("likeCount"), "DESC"]],
    });
  },
  findRankComic({ limit , orderByField }, { model } = {}){
    return model.Comic.findAll({
      limit,
      attributes: [
        [col("Comic.comicId"), "id"],"title","slug","createdAt",
        [col("coverImage"), "image"],
        [literal("(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"), "followerCount"],
        [literal("(SELECT SUM(views) FROM Chapters WHERE Chapters.comicId = Comic.comicId)"), "views"],
        [literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "rating"],
        [literal("(SELECT c.chapterNumber FROM Chapters c WHERE c.comicId = Comic.comicId ORDER BY c.chapterNumber DESC LIMIT 1)"), 'latestChapter']
      ],
      order: [[literal(orderByField), "DESC"]],
    });
  },
  getTitleById(id, { model } = {}) {
    return model.Comic.findOne({
      where: { comicId: id },
      attributes: ["title"],
    });
  },
  findAndCountAll(options = {}, { model } = {}) {
    return model.Comic.findAndCountAll(options);
  },
  create(data, { model, transaction } = {}) {
    return model.Comic.create(data, { transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.Comic.update(data, { where: { comicId: id }, transaction });
  },
};
