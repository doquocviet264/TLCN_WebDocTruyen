// app/repositories/genre.repo.js
module.exports = {
  findAll(options = {}, { model } = {}) {
    const defaultOptions = {
      attributes: ["genreId", "name"],
      order: [["name", "ASC"]],
      ...options,
    };
    return model.Genre.findAll(defaultOptions);
  },

  findAndCountAll({ where = {}, limit, offset, order = [["genreId", "ASC"]] }, { model } = {}) {
    return model.Genre.findAndCountAll({ where, limit, offset, order });
  },

  findOne(where = {}, { model } = {}) {
    return model.Genre.findOne({ where });
  },

  findByPk(id, { model } = {}) {
    return model.Genre.findByPk(id);
  },

  create(data, { model } = {}) {
    return model.Genre.create(data);
  },
  updateById(id, data, { model } = {}) {
    return model.Genre.update(data, { where: { genreId: id } });
  },
  random(limit, { model } = {}) {
    return model.Genre.findAll({ order: model.sequelize.random(), limit });
  },
};
