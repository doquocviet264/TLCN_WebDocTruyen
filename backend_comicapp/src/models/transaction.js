module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    transactionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    walletId: {               
      type: DataTypes.INTEGER,
      allowNull: true,  
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('success', 'pending', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    tableName: 'Transactions',
    timestamps: true,
    createdAt: 'transactionDate',
    updatedAt: false
  });

  return Transaction;
};
