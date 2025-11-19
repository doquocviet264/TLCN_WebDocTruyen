// app/repositories/groupMember.repo.js
module.exports = {
  findOne(where = {}, { model, transaction, include } = {}) {
    return model.TranslationGroupMember.findOne({
      where,
      include,
      transaction,
    });
  },

  findAll(where = {}, { model, transaction, include } = {}) {
    return model.TranslationGroupMember.findAll({
      where,
      include,
      transaction,
    });
  },

  count(where = {}, { model, transaction } = {}) {
    return model.TranslationGroupMember.count({ where, transaction });
  },

  create(data, { model, transaction } = {}) {
    return model.TranslationGroupMember.create(data, { transaction });
  },

  destroy(where = {}, { model, transaction } = {}) {
    return model.TranslationGroupMember.destroy({ where, transaction });
  },
};
