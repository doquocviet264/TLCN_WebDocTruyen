// app/repositories/notification-delivery.repo.js
module.exports = {
  create(data, { model, transaction } = {}) {
    return model.NotificationDelivery.create(data, { transaction });
  },

  bulkCreate(rows, { model, transaction, ignoreDuplicates = true } = {}) {
    return model.NotificationDelivery.bulkCreate(rows, { transaction, ignoreDuplicates });
  },

  // options: { where, order, limit, offset, include, attributes }
  findAll(
    { where = {}, order = [["deliveredAt", "DESC"]], limit = 100, offset = 0, include, attributes } = {},
    { model } = {}
  ) {
    return model.NotificationDelivery.findAll({ where, order, limit, offset, include, attributes });
  },

  count({ where = {} } = {}, { model } = {}) {
    return model.NotificationDelivery.count({ where });
  },

  findOne(where = {}, { model } = {}) {
    return model.NotificationDelivery.findOne({ where });
  },

  updateMany(where = {}, data, { model, transaction } = {}) {
    return model.NotificationDelivery.update(data, { where, transaction });
  },
};
