// app/repositories/chapterUnlock.repo.js
module.exports = {
  findOne(where = {}, { model, transaction } = {}) {
    return model.ChapterUnlock.findOne({ where, transaction });
  },
  create(data, { model, transaction } = {}) {
    return model.ChapterUnlock.create(data, { transaction });
  },
};
