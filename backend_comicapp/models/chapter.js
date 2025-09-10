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
    }
  }, {
    tableName: 'Chapters',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt', 
  });

  return Chapter;
};
