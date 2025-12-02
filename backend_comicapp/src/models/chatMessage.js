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
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metaJson: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'chatmessages',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false,
  });

  return ChatMessage;
};
