module.exports = (sequelize, DataTypes) => {
    const AlternateName = sequelize.define("AlternateName", {
        nameId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        comicId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'AlternateNames',
        timestamps: false, 
    });
    return AlternateName;
};