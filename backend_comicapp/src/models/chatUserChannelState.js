module.exports = (sequelize, DataTypes) => {
  const ChatUserChannelState = sequelize.define('ChatUserChannelState', {
    stateId: {
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
    lastReadMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hasSeenRules: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'chatUserChannelStates', 
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });

  return ChatUserChannelState;
};
