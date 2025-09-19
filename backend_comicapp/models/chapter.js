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
      defaultValue: 0,       // mặc định chưa xem
      allowNull: false
    },
    cost:{
      type: DataTypes.INTEGER, 
      defaultValue: 1,
    },
    isLocked: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: false,   // false = chương miễn phí, true = trả phí
      allowNull: false
    }
  }, {
    tableName: 'Chapters',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt', 
  });

  return Chapter;
};
