module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    messageId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM('USER', 'BOT', 'SYSTEM'),
      allowNull: false,
      defaultValue: 'USER',
    },
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    deletedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deletedReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isPinned: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    metaJson: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'chatmessages',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });

  return ChatMessage;
};
