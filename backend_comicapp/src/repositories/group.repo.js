// app/repositories/group.repo.js
module.exports = {
  findById(id, { model, transaction, include } = {}) {
    return model.TranslationGroup.findByPk(id, { include, transaction });
  },

  findAll(where = {}, { model, transaction, include, order } = {}) {
    return model.TranslationGroup.findAll({ where, include, order, transaction });
  },

  create(data, { model, transaction } = {}) {
    return model.TranslationGroup.create(data, { transaction });
  },

  updateById(id, data, { model, transaction } = {}) {
    return model.TranslationGroup.update(data, {
      where: { groupId: id },
      transaction,
    });
  },
  findAndCountAll(where = {}, { model, transaction, include, order, limit, offset } = {}) {
    return model.TranslationGroup.findAndCountAll({
      where,
      distinct: true,
      col: "groupId",
      include,
      order,
      limit,
      offset,
      transaction,
    });
  },
  destroyById(id, { model, transaction } = {}) {
    return model.TranslationGroup.destroy({
      where: { groupId: id },
      transaction,
    });
  },
};
