// app/repositories/comic-follow.repo.js
module.exports = {
  countFollowedByUser(userId, { model } = {}) {
    // đếm qua bảng trung gian ComicFollows
    return model.ComicFollow.count({ where: { userId } });
  },
  getFollowingComics(user, { limit = 8 } = {}) {
    return user.getFollowingComics({
      attributes: [["comicId","id"], "title", ["coverImage","cover"], "slug"],
      joinTableAttributes: [],
      limit,
      order: [[user.sequelize.literal("`ComicFollows`.`followDate`"), "DESC"]],
    });
  },
};
