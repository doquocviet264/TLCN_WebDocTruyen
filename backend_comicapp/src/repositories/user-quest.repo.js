// app/repositories/user-quest.repo.js
module.exports = {
  findAll(where = {}, { model, include, transaction } = {}) {
    return model.UserQuest.findAll({ where, include, transaction });
  },

  findOne(where = {}, { model, include, transaction } = {}) {
    return model.UserQuest.findOne({ where, include, transaction });
  },

  bulkCreate(rows = [], { model, transaction } = {}) {
    return model.UserQuest.bulkCreate(rows, { transaction });
  },

  updateById(id, data, { model, transaction } = {}) {
    return model.UserQuest.update(data, { where: { userQuestId: id }, transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.UserQuest.update(data, { where: { userQuestId: id }, transaction });
  },

  save(instance, { transaction } = {}) {
    return instance.save({ transaction });
  },
};
