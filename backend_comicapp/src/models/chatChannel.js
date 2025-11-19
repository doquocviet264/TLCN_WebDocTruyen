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
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('GLOBAL', 'ROOM', 'PRIVATE'),
      allowNull: false,
      defaultValue: 'GLOBAL',
    },
    isActive: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
  }, {
    tableName: 'chatchannels', 
    timestamps: true, 
    createdAt: 'createdAt', 
    updatedAt: 'updatedAt', 
  });

  return ChatChannel;
};
