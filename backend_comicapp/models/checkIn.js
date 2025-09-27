module.exports = (sequelize, DataTypes) => {
  const Checkin = sequelize.define('Checkin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    day: {
      type: DataTypes.INTEGER,
      allowNull: false, // từ 1 đến 7 (reset sau ngày 7)
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'Checkins',
    timestamps: false, // chỉ lưu createdAt thôi
  });

  return Checkin;
};
