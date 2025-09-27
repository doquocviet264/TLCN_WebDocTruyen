module.exports = (sequelize, DataTypes) => {
  const Quest = sequelize.define('Quest', {
    questId: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    title: { 
      type: DataTypes.STRING(100), 
      allowNull: false 
    },
    targetValue: { 
      type: DataTypes.INTEGER, 
      defaultValue: 1 
    },
    rewardCoins: { 
      type: DataTypes.INTEGER, 
      defaultValue: 50 
    },
    category: { 
      type: DataTypes.ENUM('checkin', 'reading', 'comment', 'favorite', 'rating'),
      allowNull: false
    }
  }, {
    tableName: 'quest',
    timestamps: false,
  });

  return Quest;
};