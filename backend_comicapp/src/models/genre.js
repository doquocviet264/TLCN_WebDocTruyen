module.exports = (sequelize, DataTypes) => {
    const Genre = sequelize.define("Genre", {
        genreId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    }, { 
        tableName: 'Genre', 
        timestamps: false 
    });
    return Genre;
};