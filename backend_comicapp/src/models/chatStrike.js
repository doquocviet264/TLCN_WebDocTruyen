module.exports = (sequelize, DataTypes) => {
  const ChatStrike = sequelize.define('ChatStrike', {
    strikeId: {
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
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    score: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM('AUTO_RULE', 'AUTO_AI', 'MANUAL'),
      allowNull: false,
      defaultValue: 'AUTO_RULE',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'chatstrikes', 
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false, 
  });

  return ChatStrike;
};
