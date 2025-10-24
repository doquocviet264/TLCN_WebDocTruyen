// app/repositories/transaction.repo.js
module.exports = {
  create(data, { model, transaction } = {}) {
    return model.Transaction.create(data, { transaction });
  },
  findAll(where = {}, { model, limit = 20, order = [["transactionDate","DESC"]] } = {}) {
    return model.Transaction.findAll({ where, limit, order });
  },
};
