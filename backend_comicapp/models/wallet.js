module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define('Wallet', {
    walletId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'Wallets',
    timestamps: true,
    createdAt: false,
    updatedAt: 'lastUpdated'
  });

  return Wallet;
};
