module.exports = (sequelize, DataTypes) => {
  const ChatMute = sequelize.define('ChatMute', {
    muteId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mutedUntil: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

  }, {
    tableName: 'chatmutes',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
  });

  return ChatMute;
};
