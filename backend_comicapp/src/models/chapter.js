module.exports = (sequelize, DataTypes) => {
  const Chapter = sequelize.define('Chapter', {
    chapterId: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    chapterNumber: { 
      type: DataTypes.DECIMAL(10, 2), 
      allowNull: false 
    },
    title: { 
      type: DataTypes.STRING 
    },
    views: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0,
      allowNull: false
    },
    cost:{
      type: DataTypes.INTEGER, 
      defaultValue: 0,
    },
    isLocked: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,
      allowNull: false
    }
  }, {
    tableName: 'Chapters',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt', 
  });

  return Chapter;
};
