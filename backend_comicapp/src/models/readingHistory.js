module.exports = (sequelize, DataTypes) => {
  const ReadingHistory = sequelize.define('ReadingHistory', {
    historyId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pageNumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
  }, {
    tableName: 'ReadingHistory',
    timestamps: true,
    createdAt: false,
    updatedAt: 'lastReadAt'
  });

  return ReadingHistory;
};
