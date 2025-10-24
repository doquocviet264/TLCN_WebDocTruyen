// app/repositories/chapter.repo.js
module.exports = {
  findById(id, { model, transaction } = {}) {
    return model.Chapter.findByPk(id, { transaction });
  },
  findOne(where = {}, { model, transaction, include, order } = {}) {
    return model.Chapter.findOne({ where, include, order, transaction });
  },
  findAll(where = {}, { model, transaction, include, order } = {}) {
    return model.Chapter.findAll({ where, include, order, transaction });
  },
  create(data, { model, transaction } = {}) {
    return model.Chapter.create(data, { transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.Chapter.update(data, { where: { chapterId: id }, transaction });
  },
  destroyImagesByIds(ids = [], { model, transaction } = {}) {
    return model.ChapterImage.destroy({ where: { imageId: ids }, transaction });
  },
  maxChapterNumberByComic(comicId, { model } = {}) {
    return model.Chapter.max("chapterNumber", { where: { comicId } });
  },
};
