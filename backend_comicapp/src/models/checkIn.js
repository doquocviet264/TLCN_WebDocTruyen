module.exports = (sequelize, DataTypes) => {
  const CheckIn = sequelize.define('CheckIn', {
    checkinId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
      userId: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
      },
      currentStreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      longestStreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastCheckinDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
  }, {
    tableName: 'CheckIns',
    timestamps: true,
    createdAt: false,
    updatedAt: true,
  });

  return CheckIn;
};
