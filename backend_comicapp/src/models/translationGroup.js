// models/translationGroup.js
module.exports = (sequelize, DataTypes) => {
  const TranslationGroup = sequelize.define(
    "TranslationGroup",
    {
      groupId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false, // user tạo nhóm
      },
      channelId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      }
    },
    {
      tableName: "translationGroups",
      timestamps: true,
    }
  );

  return TranslationGroup;
};
