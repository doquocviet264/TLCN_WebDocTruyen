// app/repositories/comment.repo.js
const { col } = require('sequelize');

module.exports = {
  findByPk(id, { model, transaction, include } = {}) {
    return model.Comment.findByPk(id, { include, transaction });
  },

  findAndCountRootByComicSlug({ slug, limit, offset }, { model } = {}) {
    // Lấy comment gốc (parentId=null) của 1 comic theo slug (kèm user & replies)
    return model.Comment.findAndCountAll({
      include: [
        {
          model: model.Comic,
          attributes: [],
          where: { slug },
        },
        { model: model.User, attributes: ["username"] },
        {
          model: model.Comment,
          as: "replies",
          include: [{ model: model.User, attributes: ["username"] }],
        },
      ],
      where: { parentId: null },
      attributes: ["commentId", "content", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
  }, 
  findAndCountRootByChapterId({ chapterId, limit, offset }, { model } = {}) {
    // Lấy comment gốc (parentId=null) của 1 chapter (kèm user & replies)
    return model.Comment.findAndCountAll({
      include: [
        { model: model.User, attributes: ["username"] },
        {
          model: model.Comment,
          as: "replies",
          include: [{ model: model.User, attributes: ["username"] }],
        },
      ],
      where: { 
        parentId: null,
        chapterId: chapterId // Lọc theo chapterId
      },
      attributes: ["commentId", "content", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
  },

  findRecent({ limit = 10 }, { model } = {}) {
    return model.Comment.findAll({
      limit,
      where: { parentId: null },
      order: [["createdAt", "DESC"]],
      attributes: [[col("commentId"), "id"], "content", "createdAt"],
      include: [
        { model: model.User, attributes: ["username", "avatar"] },
        { model: model.Comic, attributes: ["title", "slug"] },
      ],
    });
  },

  findAndCountAllAdmin({ limit, offset }, { model } = {}) {
    return model.Comment.findAndCountAll({
      include: [
        { model: model.User, attributes: ["userId", "username", "email", "avatar"] },
        { model: model.Comic, attributes: ["comicId", "title"] },
      ],
      attributes: ["commentId", "content", "createdAt", "comicId", "parentId"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
  },

  create(data, { model, transaction } = {}) {
    return model.Comment.create(data, { transaction });
  },

  destroy(where, { model, transaction } = {}) {
    return model.Comment.destroy({ where, transaction });
  },
  count(where = {}, { model } = {}) {
    return model.Comment.count({ where });
  },
  findAll(where = {}, { model, include = [], limit = 5, offset = 0, order = [["createdAt","DESC"]] } = {}) {
    const baseInclude = [
      { model: model.Comic, attributes: ["title", "slug"] },
      { model: model.Chapter, attributes: ["chapterId", "title", "chapterNumber"] },
    ];
    return model.Comment.findAll({
      where,
      include: [...baseInclude, ...include],
      limit,
      offset,
      order
    });
  },
};
