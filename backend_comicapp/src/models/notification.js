module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    notificationId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category: {
      type: DataTypes.ENUM('comic_update', 'system', 'follow', 'comment', 'promotion'),
      allowNull: false
    },
    audienceType: {
        type: DataTypes.ENUM("global", "direct"),
        allowNull: false,
        defaultValue: "direct",
      },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: true,
    updatedAt: false
  });

  return Notification;
};
