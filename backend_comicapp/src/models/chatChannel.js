module.exports = (sequelize, DataTypes) => {
  const ChatChannel = sequelize.define('ChatChannel', {
    channelId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('global', 'room', 'private'),
      allowNull: false,
      defaultValue: 'global',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  }, {
    tableName: 'chatchannels', 
    timestamps: true, 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt', 
  });

  return ChatChannel;
};
