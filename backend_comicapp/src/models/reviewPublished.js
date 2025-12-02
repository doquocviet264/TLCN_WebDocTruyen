module.exports = (sequelize, DataTypes) => {
  const ReviewPublished = sequelize.define('ReviewPublished', {
    reviewId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalDuration: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timeline: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    tableName: 'ReviewPublisheds',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });

  return ReviewPublished;
};
