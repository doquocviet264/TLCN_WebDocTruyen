// app/repositories/chapterImage.repo.js
module.exports = {
  findAll(where = {}, { model, transaction, order } = {}) {
    return model.ChapterImage.findAll({ where, order, transaction });
  },
  create(data, { model, transaction } = {}) {
    return model.ChapterImage.create(data, { transaction });
  },
  bulkCreate(rows = [], { model, transaction } = {}) {
    return model.ChapterImage.bulkCreate(rows, { transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.ChapterImage.update(data, { where: { imageId: id }, transaction });
  },
};
