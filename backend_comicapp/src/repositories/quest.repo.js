// app/repositories/quest.repo.js
module.exports = {
  findAll(where = {}, { model } = {}) {
    return model.Quest.findAll({ where });
  },
  findOne(where = {}, { model } = {}) {
    return model.Quest.findOne({ where });
  },
};
