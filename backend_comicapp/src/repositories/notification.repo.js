// app/repositories/notification.repo.js
module.exports = {
  create(data, { model, transaction } = {}) {
    return model.Notification.create(data, { transaction });
  },

  // options: { where, order, limit, offset, attributes, include }
  findAll(
    { where = {}, order = [["createdAt", "DESC"]], limit = 100, offset = 0, attributes, include } = {},
    { model } = {}
  ) {
    return model.Notification.findAll({ where, order, limit, offset, attributes, include });
  },

  count({ where = {} } = {}, { model } = {}) {
    return model.Notification.count({ where });
  },

  findOne(where = {}, { model } = {}) {
    return model.Notification.findOne({ where });
  },

  updateById(id, data, { model, transaction } = {}) {
    return model.Notification.update(data, { where: { notificationId: id }, transaction });
  },

  updateMany(where = {}, data, { model, transaction } = {}) {
    return model.Notification.update(data, { where, transaction });
  },
};
