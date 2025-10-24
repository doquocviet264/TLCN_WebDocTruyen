// app/repositories/reading-history.repo.js
module.exports = {
  findOne(options = {}, { model } = {}) {
    return model.ReadingHistory.findOne(options);
  },

  create(data, { model, transaction } = {}) {
    return model.ReadingHistory.create(data, { transaction });
  },

  updateById(id, data, { model, transaction } = {}) {
    return model.ReadingHistory.update(data, { where: { id }, transaction });
  },

  save(instance, { transaction } = {}) {
    return instance.save({ transaction });
  },
  

  destroy(where = {}, { model, transaction } = {}) {
    return model.ReadingHistory.destroy({ where, transaction });
  },

  findAllForUser({ userId, limit }, { model } = {}) {
    return model.ReadingHistory.findAll({
      where: { userId },
      include: [
        {
          model: model.Comic,
          attributes: ["comicId", "title", "slug", "coverImage"],
          include: [
            {
              model: model.Chapter,
              attributes: ["chapterNumber"],
              order: [["chapterNumber", "DESC"]],
              limit: 1,
              separate: true,
            },
          ],
        },
        {
          model: model.Chapter,
          attributes: ["chapterId", "chapterNumber", "title"],
        },
      ],
      order: [["lastReadAt", "DESC"]],
      limit,
    });
  },
  findAllLatestPerComic(userId, { model } = {}) {
    // lấy lastReadAt max theo comicId
    const { Sequelize } = model;
    return model.ReadingHistory.findAll({
      where: { userId },
      attributes: [
        "comicId",
        [Sequelize.fn("MAX", Sequelize.col("lastReadAt")), "lastReadAt"],
      ],
      group: ["comicId"],
      raw: true,
    });
  },
};
