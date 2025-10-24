// app/repositories/checkin.repo.js
module.exports = {
  findLastByUser(userId, { model } = {}) {
    return model.CheckIn.findOne({ where: { userId }, order: [["createdAt","DESC"]] });
  },
  create(data, { model, transaction } = {}) {
    return model.CheckIn.create(data, { transaction });
  },
  destroy(where = {}, { model, transaction } = {}) {
    return model.CheckIn.destroy({ where, transaction });
  },
};
