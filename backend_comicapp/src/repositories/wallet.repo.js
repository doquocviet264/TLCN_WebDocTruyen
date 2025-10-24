// app/repositories/wallet.repo.js
module.exports = {
  findOne(where = {}, { model, transaction } = {}) {
    return model.Wallet.findOne({ where, transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.Wallet.update(data, { where: { walletId: id }, transaction });
  },
};
