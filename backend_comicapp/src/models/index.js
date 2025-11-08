const { Sequelize } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const db = {};
  db.Sequelize = Sequelize;
  db.sequelize = sequelize;

  db.User            = require("./user")(sequelize, DataTypes);
  db.Comic           = require("./comic")(sequelize, DataTypes);
  db.AlternateName   = require("./alternateName")(sequelize, DataTypes);
  db.Genre           = require("./genre")(sequelize, DataTypes);
  db.Chapter         = require("./chapter")(sequelize, DataTypes);
  db.Comment         = require("./comment")(sequelize, DataTypes);
  db.ChapterImage    = require("./chapterImage")(sequelize, DataTypes);
  db.Transaction     = require("./transaction")(sequelize, DataTypes);
  db.ReadingHistory  = require("./readingHistory")(sequelize, DataTypes);
  db.Wallet          = require("./wallet")(sequelize, DataTypes);
  db.CheckIn         = require("./checkIn")(sequelize, DataTypes);
  db.Quest           = require("./quest")(sequelize, DataTypes);
  db.Notification    = require("./notification")(sequelize, DataTypes);
  db.Report          = require("./report")(sequelize, DataTypes);

  db.ComicFollow = sequelize.define(
    "ComicFollows",
    { followId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true } },
    { tableName: "ComicFollows", timestamps: true, updatedAt: false, createdAt: "followDate" }
  );

  db.ComicLike = sequelize.define(
    "ComicLikes",
    { likeId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true } },
    { tableName: "ComicLikes", timestamps: true, updatedAt: false, createdAt: "likeDate" }
  );

  db.ComicRating = sequelize.define(
    "ComicRatings",
    {
      ratingId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      score: { type: DataTypes.INTEGER },
    },
    { tableName: "ComicRatings", timestamps: true, updatedAt: false, createdAt: "ratingAt" }
  );

  db.CommentLikes = sequelize.define(
    "CommentLikes",
    {
      likeId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      commentId: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "CommentLikes", timestamps: true, createdAt: true, updatedAt: false }
  );

  db.ChapterUnlock = sequelize.define(
    "ChapterUnlock",
    {
      unlockId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      chapterId: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "chapterUnlocks", timestamps: true, createdAt: "unlockedAt", updatedAt: false }
  );
  db.NotificationDelivery = sequelize.define(
    "NotificationDeliveries",
    {
      deliveryId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      notificationId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: "NotificationDeliveries", timestamps: true, createdAt: "deliveredAt", updatedAt: false }
  );

  db.UserQuest = sequelize.define(
    "UserQuests",
    {
      userQuestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      questId: { type: DataTypes.INTEGER, allowNull: false },
      progress: { type: DataTypes.INTEGER, defaultValue: 0 },
      isClaimed: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: "UserQuests", timestamps: true, createdAt: "assignedDate", updatedAt: false }
  );

  db.Post = sequelize.define(
  "Post",
  {
    postId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },

    comicId: { type: DataTypes.INTEGER, allowNull: true }, 

    type: {
      type: DataTypes.ENUM("review", "find_similar"),
      allowNull: false,
    },

    ratingStoryLine: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, validate: { min: 1, max: 5 } },
    ratingCharacters:{ type: DataTypes.TINYINT.UNSIGNED, allowNull: true, validate: { min: 1, max: 5 } },
    ratingArt:        { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, validate: { min: 1, max: 5 } },
    ratingEmotion:    { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, validate: { min: 1, max: 5 } },
    ratingCreativity: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true, validate: { min: 1, max: 5 } },

    title:   { type: DataTypes.STRING(255), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },

  },
  {
    tableName: "posts",
    timestamps: true,
  }
);
  db.PostImage = sequelize.define(
  "PostImage",
  {
    postimageId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    postId:      { type: DataTypes.INTEGER, allowNull: false },
    imageUrl:    { type: DataTypes.STRING(500), allowNull: false },
    imageNumber: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "postimages",
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  }
);

db.PostGenre = sequelize.define(
  "PostGenre",
  {
    postId:  { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    genreId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  },
  { tableName: "postgenres", timestamps: false }
);

db.PostLike = sequelize.define(
  "PostLike",
  {
    userId:    { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    postId:    { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  },
  {
    tableName: "postlikes",
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  }
);

db.PostComment = sequelize.define(
  "PostComment",
  {
    commentId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    postId:    { type: DataTypes.INTEGER, allowNull: false },
    userId:    { type: DataTypes.INTEGER, allowNull: false },
    parentId:  { type: DataTypes.INTEGER, allowNull: true },
    content:   { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "postcomments",
    timestamps: true,
    createdAt: true,
    updatedAt: false,
  }
);
  // ===================== Associations =====================

  // Comic <-> Genre (M:N)
  db.Comic.belongsToMany(db.Genre, { through: "GenreComic",timestamps: false, foreignKey: "comicId" });
  db.Genre.belongsToMany(db.Comic, { through: "GenreComic",timestamps: false, foreignKey: "genreId" });

  // Comic <-> AlternateName (1:N)
  db.Comic.hasMany(db.AlternateName, { foreignKey: "comicId" });
  db.AlternateName.belongsTo(db.Comic, { foreignKey: "comicId" });

  // User <-> Comic (Follows M:N)
  db.User.belongsToMany(db.Comic, { through: db.ComicFollow, as: "FollowingComics", foreignKey: "userId" });
  db.Comic.belongsToMany(db.User, { through: db.ComicFollow, as: "Followers", foreignKey: "comicId" });

  // User <-> Comic (Likes M:N)
  db.User.belongsToMany(db.Comic, { through: db.ComicLike, as: "LikedComics", foreignKey: "userId" });
  db.Comic.belongsToMany(db.User, { through: db.ComicLike, as: "Likers", foreignKey: "comicId" });

  // Comment <-> Chapter (1:N)  ⟵ THÊM
  db.Comment.belongsTo(db.Chapter, { foreignKey: "chapterId" });
  db.Chapter.hasMany(db.Comment, { foreignKey: "chapterId" });
  // User/Comic <-> ComicRating (1:N)
  db.Comic.hasMany(db.ComicRating, { foreignKey: "comicId" });
  db.ComicRating.belongsTo(db.Comic, { foreignKey: "comicId" });
  db.User.hasMany(db.ComicRating, { foreignKey: "userId" });
  db.ComicRating.belongsTo(db.User, { foreignKey: "userId" });

  // Comic <-> Chapter (1:N)
  db.Comic.hasMany(db.Chapter, { foreignKey: "comicId" });
  db.Chapter.belongsTo(db.Comic, { foreignKey: "comicId" });

  // Comment self-ref (1:N)
  db.Comment.hasMany(db.Comment, { as: "replies", foreignKey: "parentId" });
  db.Comment.belongsTo(db.Comment, { as: "parent", foreignKey: "parentId" });

  // Comment <-> User (1:N)
  db.Comment.belongsTo(db.User, { foreignKey: "userId" });
  db.User.hasMany(db.Comment, { foreignKey: "userId" });

  // Comment <-> Comic (1:N)
  db.Comment.belongsTo(db.Comic, { foreignKey: "comicId" });
  db.Comic.hasMany(db.Comment, { foreignKey: "comicId" });

  // Comment <-> CommentLikes (1:N) & User <-> CommentLikes (1:N)
  db.Comment.hasMany(db.CommentLikes, { foreignKey: "commentId", as: "likes" });
  db.CommentLikes.belongsTo(db.Comment, { foreignKey: "commentId" });
  db.User.hasMany(db.CommentLikes, { foreignKey: "userId", as: "likedComments" });
  db.CommentLikes.belongsTo(db.User, { foreignKey: "userId" });

  // Chapter <-> ChapterImage (1:N)
  db.Chapter.hasMany(db.ChapterImage, { foreignKey: "chapterId" });
  db.ChapterImage.belongsTo(db.Chapter, { foreignKey: "chapterId" });

  // User <-> ChapterUnlock (M:N) + back-refs
  db.User.belongsToMany(db.Chapter, { through: db.ChapterUnlock, foreignKey: "userId", otherKey: "chapterId" });
  db.Chapter.belongsToMany(db.User, { through: db.ChapterUnlock, foreignKey: "chapterId", otherKey: "userId" });
  db.ChapterUnlock.belongsTo(db.User, { foreignKey: "userId" });
  db.ChapterUnlock.belongsTo(db.Chapter, { foreignKey: "chapterId" });
  db.User.hasMany(db.ChapterUnlock, { foreignKey: "userId" });
  db.Chapter.hasMany(db.ChapterUnlock, { foreignKey: "chapterId" });

  // User <-> Notification qua NotificationDelivery (M:N)
  db.User.belongsToMany(db.Notification, { through: db.NotificationDelivery, as: "notifications", foreignKey: "userId", otherKey: "notificationId" });
  db.Notification.belongsToMany(db.User, { through: db.NotificationDelivery, as: "users", foreignKey: "notificationId", otherKey: "userId" });
  db.User.hasMany(db.NotificationDelivery, { foreignKey: "userId" });
  db.NotificationDelivery.belongsTo(db.User, { foreignKey: "userId" });
  db.Notification.hasMany(db.NotificationDelivery, { foreignKey: "notificationId" });
  db.NotificationDelivery.belongsTo(db.Notification, { foreignKey: "notificationId" });

  // Chapter <-> Transaction (1:N)
  db.Chapter.hasMany(db.Transaction, { foreignKey: "chapterId" });
  db.Transaction.belongsTo(db.Chapter, { foreignKey: "chapterId" });

  // ReadingHistory (User 1:N, Comic 1:N, Chapter 1:N)
  db.User.hasMany(db.ReadingHistory, { foreignKey: "userId" });
  db.ReadingHistory.belongsTo(db.User, { foreignKey: "userId" });
  db.Comic.hasMany(db.ReadingHistory, { foreignKey: "comicId" });
  db.ReadingHistory.belongsTo(db.Comic, { foreignKey: "comicId" });
  db.Chapter.hasMany(db.ReadingHistory, { foreignKey: "chapterId" });
  db.ReadingHistory.belongsTo(db.Chapter, { foreignKey: "chapterId" });

  // User <-> Wallet (1:1) & Wallet <-> Transaction (1:N)
  db.User.hasOne(db.Wallet, { foreignKey: "userId" });
  db.Wallet.belongsTo(db.User, { foreignKey: "userId" });
  db.Wallet.hasMany(db.Transaction, { foreignKey: "walletId" });
  db.Transaction.belongsTo(db.Wallet, { foreignKey: "walletId" });

  // User <-> CheckIn (1:N)
  db.User.hasMany(db.CheckIn, { foreignKey: "userId" });
  db.CheckIn.belongsTo(db.User, { foreignKey: "userId" });

  // User <-> Quest (M:N) + UserQuest back-refs
  db.User.belongsToMany(db.Quest, { through: db.UserQuest, foreignKey: "userId", otherKey: "questId", as: "Quests" });
  db.Quest.belongsToMany(db.User, { through: db.UserQuest, foreignKey: "questId", otherKey: "userId", as: "Users" });
  db.UserQuest.belongsTo(db.User, { foreignKey: "userId" });
  db.UserQuest.belongsTo(db.Quest, { foreignKey: "questId" });
  db.User.hasMany(db.UserQuest, { foreignKey: "userId" });
  db.Quest.hasMany(db.UserQuest, { foreignKey: "questId" });

  // User <-> Report (1:N)
  db.User.hasMany(db.Report, { foreignKey: "userId", as: "reports" });
  db.Report.belongsTo(db.User, { foreignKey: "userId", as: "user" });

  // Post ↔ User
  db.Post.belongsTo(db.User, { foreignKey: "userId", as: "author" });
  db.User.hasMany(db.Post, { foreignKey: "userId", as: "posts" });

  // Post ↔ Comic
  db.Post.belongsTo(db.Comic, { foreignKey: "comicId", as: "comic" });
  db.Comic.hasMany(db.Post, { foreignKey: "comicId", as: "posts" });

  // Post ↔ PostImage
  db.Post.hasMany(db.PostImage, { foreignKey: "postId", as: "images" });
  db.PostImage.belongsTo(db.Post, { foreignKey: "postId" });

  // Post ↔ Genre
  db.Post.belongsToMany(db.Genre, {
    through: db.PostGenre,
    foreignKey: "postId",
    otherKey: "genreId",
    as: "genres",
  });
  db.Genre.belongsToMany(db.Post, {
    through: db.PostGenre,
    foreignKey: "genreId",
    otherKey: "postId",
    as: "posts",
  });

  // User ↔ PostLike
  db.User.belongsToMany(db.Post, {
    through: db.PostLike,
    foreignKey: "userId",
    otherKey: "postId",
    as: "LikedPosts",
  });
  db.Post.belongsToMany(db.User, {
    through: db.PostLike,
    foreignKey: "postId",
    otherKey: "userId",
    as: "Likers",
  });

  // Post ↔ PostComment
  db.Post.hasMany(db.PostComment, { foreignKey: "postId", as: "comments" });
  db.PostComment.belongsTo(db.Post, { foreignKey: "postId" });

  // User ↔ PostComment
  db.User.hasMany(db.PostComment, { foreignKey: "userId", as: "postComments" });
  db.PostComment.belongsTo(db.User, { foreignKey: "userId", as: "author" });

  // PostComment self-reference (reply)
  db.PostComment.hasMany(db.PostComment, { foreignKey: "parentId", as: "replies" });
  db.PostComment.belongsTo(db.PostComment, { foreignKey: "parentId", as: "parent" });



  return db;
};
