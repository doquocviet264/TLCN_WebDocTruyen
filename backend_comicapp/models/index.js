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
db.ChapterImage = require('./chapterImage.js')(sequelize, DataTypes);
db.Transaction = require('./transaction.js')(sequelize, DataTypes);
db.ReadingHistory = require('./readingHistory.js')(sequelize, DataTypes);
db.Wallet = require('./wallet.js')(sequelize, DataTypes);
db.CheckIn = require('./checkIn.js')(sequelize, DataTypes);
db.Quest = require('./quest.js')(sequelize, DataTypes);
// Định nghĩa các bảng trung gian và thiết lập mối quan hệ
db.ComicFollow = sequelize.define('ComicFollows', {
    followId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
}, { tableName: 'ComicFollows', timestamps: true, updatedAt: false, createdAt: 'followDate' });

db.ComicRating = sequelize.define('ComicRatings', {
  ratingId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  score: { type: DataTypes.INTEGER },
}, { tableName: 'ComicRatings', timestamps: true, updatedAt: false,  createdAt: 'ratingAt'});

db.CommentLikes = sequelize.define('CommentLikes', {
  likeId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  commentId: { type: DataTypes.INTEGER, allowNull: false },
}, {tableName: 'CommentLikes', timestamps: true, createdAt: true, updatedAt: false });

db.ChapterUnlock = sequelize.define('ChapterUnlock', {
  unlockId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  chapterId: { type: DataTypes.INTEGER, allowNull: false },
}, {tableName: 'chapterUnlocks', timestamps: true, createdAt: 'unlockedAt', updatedAt: false});
db.UserQuest = sequelize.define('UserQuests', {
  userQuestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  questId: { type: DataTypes.INTEGER, allowNull: false },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  isClaimed: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {tableName: 'UserQuests', timestamps: true, createdAt: 'assignedDate', updatedAt: false});

// Định nghĩa các mối quan hệ

// Comic <-> Genre (Many-to-Many)
db.Comic.belongsToMany(db.Genre, { through: 'GenreComic', foreignKey: 'comicId', timestamps: false });
db.Genre.belongsToMany(db.Comic, { through: 'GenreComic', foreignKey: 'genreId', timestamps: false });

// User <-> Comic (Follows - Many-to-Many)
db.User.belongsToMany(db.Comic, { through: db.ComicFollow, as: 'FollowingComics', foreignKey: 'userId'});
db.Comic.belongsToMany(db.User, { through: db.ComicFollow, as: 'Followers', foreignKey: 'comicId'});

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
//Quan hệ Chapter <-> ChapterImage (Một Chapter có nhiều Image)
db.Chapter.hasMany(db.ChapterImage, { foreignKey: 'chapterId' });
db.ChapterImage.belongsTo(db.Chapter, { foreignKey: 'chapterId' });

// User <-> ChapterUnlock (Many-to-Many qua ChapterUnlock)
db.User.belongsToMany(db.Chapter, { through: db.ChapterUnlock, foreignKey: 'userId', otherKey: 'chapterId' });
db.Chapter.belongsToMany(db.User, { through: db.ChapterUnlock, foreignKey: 'chapterId', otherKey: 'userId' });
db.ChapterUnlock.belongsTo(db.User, { foreignKey: 'userId' });
db.ChapterUnlock.belongsTo(db.Chapter, { foreignKey: 'chapterId' });
db.User.hasMany(db.ChapterUnlock, { foreignKey: 'userId' });
db.Chapter.hasMany(db.ChapterUnlock, { foreignKey: 'chapterId' });

// Chapter <-> Transaction
db.Chapter.hasMany(db.Transaction, { foreignKey: 'chapterId' });
db.Transaction.belongsTo(db.Chapter, { foreignKey: 'chapterId' });

// Một User có nhiều lịch sử đọc
db.User.hasMany(db.ReadingHistory, { foreignKey: 'userId' });
db.ReadingHistory.belongsTo(db.User, { foreignKey: 'userId' });

// Một Comic có thể xuất hiện trong nhiều lịch sử
db.Comic.hasMany(db.ReadingHistory, { foreignKey: 'comicId' });
db.ReadingHistory.belongsTo(db.Comic, { foreignKey: 'comicId' });

// Một Chapter có thể xuất hiện trong nhiều lịch sử
db.Chapter.hasMany(db.ReadingHistory, { foreignKey: 'chapterId' });
db.ReadingHistory.belongsTo(db.Chapter, { foreignKey: 'chapterId' });

// User <-> Wallet (1-1)
db.User.hasOne(db.Wallet, { foreignKey: 'userId' });
db.Wallet.belongsTo(db.User, { foreignKey: 'userId' });

// Wallet <-> Transaction (1 - N)
db.Wallet.hasMany(db.Transaction, { foreignKey: 'walletId' });
db.Transaction.belongsTo(db.Wallet, { foreignKey: 'walletId' });
// User <-> CheckIn (1 - N)
db.User.hasMany(db.CheckIn, { foreignKey: 'userId' });
db.CheckIn.belongsTo(db.User, { foreignKey: 'userId' });

// User <-> Quest (Many-to-Many qua UserQuests)
db.User.belongsToMany(db.Quest, { through: db.UserQuest, foreignKey: 'userId', otherKey: 'questId', as: 'Quests' });
db.Quest.belongsToMany(db.User, { through: db.UserQuest, foreignKey: 'questId', otherKey: 'userId', as: 'Users' });

// UserQuest <-> User & Quest
db.UserQuest.belongsTo(db.User, { foreignKey: 'userId' });
db.UserQuest.belongsTo(db.Quest, { foreignKey: 'questId' });
db.User.hasMany(db.UserQuest, { foreignKey: 'userId' });
db.Quest.hasMany(db.UserQuest, { foreignKey: 'questId' });
//Export đối tượng db
module.exports = db;