module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      reportId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("comment", "chapter"),
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isResolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      targetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "reports",
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: false,   
    }
  );
  return Report;
};
