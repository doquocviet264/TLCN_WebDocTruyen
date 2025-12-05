// app/repositories/checkin.repo.js
module.exports = {
  // Lấy 1 dòng CheckIn theo userId
  findByUser(userId, { model, transaction } = {}) {
    return model.CheckIn.findOne({
      where: { userId },
      transaction,
    });
  },

  // Tạo stats cho user lần đầu
  create(data, { model, transaction } = {}) {
    return model.CheckIn.create(data, { transaction });
  },

  // Cập nhật stats theo userId
  updateByUser(userId, data, { model, transaction } = {}) {
    return model.CheckIn.update(data, {
      where: { userId },
      transaction,
    });
  },
};
