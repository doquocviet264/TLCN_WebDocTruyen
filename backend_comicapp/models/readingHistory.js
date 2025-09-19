module.exports = (sequelize, DataTypes) => {
    const ReadingHistory = sequelize.define("ReadingHistory", {
        historyId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        lastReadAt: { type: DataTypes.DATE, allowNull: false },
    }, { tableName: 'ReadingHistory', timestamps: false });
    return ReadingHistory;
};