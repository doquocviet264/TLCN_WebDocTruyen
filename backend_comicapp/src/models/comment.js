module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define("Comment", {
        commentId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        comicId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        chapterId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'Comments',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
    });
    return Comment;
};
