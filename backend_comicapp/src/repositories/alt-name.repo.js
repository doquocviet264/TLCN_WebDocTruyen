module.exports = {
  findAll(where = {}, { model, transaction } = {}) {
    return model.AlternateName.findAll({ where, transaction });
  },
  bulkCreate(data = [], { model, transaction } = {}) {
    return model.AlternateName.bulkCreate(data, { transaction });
  },
  destroy(where = {}, { model, transaction } = {}) {
    return model.AlternateName.destroy({ where, transaction });
  },
};
