module.exports = (sequelize, DataTypes) => {
    const ChapterImage = sequelize.define("ChapterImage", {
        imageId: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        chapterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        pageNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'ChapterImages',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
    });
    return ChapterImage;
};