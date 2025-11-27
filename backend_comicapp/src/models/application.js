// models/application.js
module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    "Application",
    {
      applicationId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("become_translator", "join_group"),
        allowNull: false,
      },
      targetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "applications",
      timestamps: true,
    }
  );

  

  return Application;
};
