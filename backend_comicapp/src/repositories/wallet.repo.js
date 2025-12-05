// app/repositories/wallet.repo.js
module.exports = {
  findOne(where = {}, { model, transaction } = {}) {
    return model.Wallet.findOne({ where, transaction });
  },
  updateById(id, data, { model, transaction } = {}) {
    return model.Wallet.update(data, { where: { walletId: id }, transaction });
  },
  async incrementBalance(walletId, goldAmount, { model, transaction } = {}) {
    const wallet = await this.findOne(
      { walletId },
      { model, transaction }
    );
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const newBalance = Number(wallet.balance || 0) + Number(goldAmount || 0);
    console.log(`Incrementing wallet ${walletId} balance by ${goldAmount}. New balance: ${newBalance}`);
    await this.updateById(
      walletId,
      { balance: newBalance },
      { model, transaction }
    );

    // Trả về ví sau khi cập nhật (nếu muốn)
    wallet.balance = newBalance;
    return wallet;
  },
};
