module.exports = (sequelize, DataTypes) => {
  const ReviewDraft = sequelize.define('ReviewDraft', {
    reviewId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    scriptData: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    tableName: 'ReviewDrafts',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });

  return ReviewDraft;
};
