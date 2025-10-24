// app/repositories/comic-rating.repo.js
module.exports = {
  findOne(where = {}, { model, transaction } = {}) {
    return model.ComicRating.findOne({ where, transaction });
  },
  findOrCreate(where = {}, defaults = {}, { model, transaction } = {}) {
    return model.ComicRating.findOrCreate({ where, defaults, transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.ComicRating.update(data, { where: { ratingId: id }, transaction });
  },
};
