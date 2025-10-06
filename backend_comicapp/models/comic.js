module.exports = (sequelize, DataTypes) => {
    const Comic = sequelize.define("Comic", {
        comicId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        slug: {          
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        coverImage: {
            type: DataTypes.STRING(500),
        },
        description: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.ENUM('In Progress', 'On Hold', 'Completed'),
            defaultValue: 'In Progress',
        },
    }, {
        tableName: 'Comic',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    });
    return Comic;
};