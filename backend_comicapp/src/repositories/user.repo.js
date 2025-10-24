// app/repositories/user.repo.js
module.exports = {
  findOne(where = {}, { model, transaction } = {}) {
    return model.User.findOne({ where, transaction });
  },
  findById(id, { model, transaction } = {}) {
    return model.User.findByPk(id, { transaction });
  },
  findByPk(id, { model } = {}) {
    return model.User.findByPk(id);
  },
  create(data, { model, transaction } = {}) {
    return model.User.create(data, { transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.User.update(data, { where: { userId: id }, transaction });
  },
  findByPk(id, { model, attributes, include } = {}) {
    return model.User.findByPk(id, { attributes, include });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.User.update(data, { where: { userId: id }, transaction });
  },
  findAndCountAll({ limit, offset, order = [["createdAt", "DESC"]], attributes, include }, { model } = {}) {
    return model.User.findAndCountAll({ attributes, include, order, limit, offset });
  },
};
