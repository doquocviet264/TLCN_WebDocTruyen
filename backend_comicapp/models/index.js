const {Sequelize,  DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load các model và truyền sequelize, DataTypes vào
db.User = require('./user.js')(sequelize, DataTypes);
db.Comic = require('./comic.js')(sequelize, DataTypes);
db.Genre = require('./genre.js')(sequelize, DataTypes);
db.Chapter = require('./chapter.js')(sequelize, DataTypes);
db.Comment = require('./comment.js')(sequelize, DataTypes);
// Định nghĩa các bảng trung gian và thiết lập mối quan hệ
db.ComicFollow = sequelize.define('ComicFollows', {
    followId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
}, { tableName: 'ComicFollows', timestamps: true, updatedAt: false, createdAt: 'followDate' });

db.ComicRating = sequelize.define('ComicRatings', {
  ratingId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  score: { type: DataTypes.INTEGER },
}, { tableName: 'ComicRatings', timestamps: false });

db.CommentLikes = sequelize.define('CommentLikes', {
  likeId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  commentId: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {tableName: 'CommentLikes', timestamps: false });

// Định nghĩa các mối quan hệ
// Comic <-> Genre (Many-to-Many)
db.Comic.belongsToMany(db.Genre, { through: 'GenreComic', foreignKey: 'comicId', timestamps: false });
db.Genre.belongsToMany(db.Comic, { through: 'GenreComic', foreignKey: 'genreId', timestamps: false });

// User <-> Comic (Follows - Many-to-Many)
db.User.belongsToMany(db.Comic, { through: db.ComicFollow, as: 'FollowingComics', foreignKey: 'userId', otherKey: 'comicId'});
db.Comic.belongsToMany(db.User, { through: db.ComicFollow, as: 'Followers', foreignKey: 'comicId', otherKey: 'userId'});

// User <-> Comic (Ratings - One-to-Many on User/Comic side)
db.Comic.hasMany(db.ComicRating, { foreignKey: 'comicId' });
db.ComicRating.belongsTo(db.Comic, { foreignKey: 'comicId' });
db.User.hasMany(db.ComicRating, { foreignKey: 'userId' });
db.ComicRating.belongsTo(db.User, { foreignKey: 'userId' });
// Comic <-> Chapter (One-to-Many)
db.Comic.hasMany(db.Chapter, { foreignKey: 'comicId' });
db.Chapter.belongsTo(db.Comic, { foreignKey: 'comicId' });
// Quan hệ tự tham chiếu 
db.Comment.hasMany(db.Comment, { as: 'replies', foreignKey: 'parentId' });
db.Comment.belongsTo(db.Comment, { as: 'parent', foreignKey: 'parentId' });
// Comment <-> User
db.Comment.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasMany(db.Comment, { foreignKey: 'userId' });

// Comment <-> Comic
db.Comment.belongsTo(db.Comic, { foreignKey: 'comicId' });
db.Comic.hasMany(db.Comment, { foreignKey: 'comicId' });

// Comment <-> CommentLikes
db.Comment.hasMany(db.CommentLikes, { foreignKey: 'commentId', as: 'likes' });
db.CommentLikes.belongsTo(db.Comment, { foreignKey: 'commentId' });

// User <-> CommentLikes
db.User.hasMany(db.CommentLikes, { foreignKey: 'userId', as: 'likedComments' });
db.CommentLikes.belongsTo(db.User, { foreignKey: 'userId' });

//Export đối tượng db
module.exports = db;