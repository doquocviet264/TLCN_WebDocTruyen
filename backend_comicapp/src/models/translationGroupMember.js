// models/translationgroupmember.js
module.exports = (sequelize, DataTypes) => {
  const TranslationGroupMember = sequelize.define(
    "TranslationGroupMember",
    {
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      role: {
        type: DataTypes.ENUM("leader", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "translationgroupmembers",
      timestamps: false,
      indexes: [
        { fields: ["userId"] },
        { fields: ["groupId"] },
        { fields: ["role"] },
      ],
    }
  );

  return TranslationGroupMember;
};
