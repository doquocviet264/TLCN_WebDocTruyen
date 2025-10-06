const {sequelize, Comic } = require('../models/index');


const getComicDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const comic = await Comic.findByPk(id, {
      include: [
        { model: Genre, attributes: ["name"], through: { attributes: [] } },
        { model: AlternateName, attributes: ["name"] },
      ],
      attributes: {
        include: [
          [sequelize.literal("(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"), "followerCount"],
          [sequelize.literal("(SELECT SUM(views) FROM Chapters WHERE Chapters.comicId = Comic.comicId)"), "totalViews"],
          [sequelize.literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "avgRating"],
          [sequelize.literal("(SELECT COUNT(*) FROM Comments WHERE Comments.comicId = Comic.comicId)"), "commentCount"],
        ]
      }
    });

    if (!comic) {
      return res.status(404).json({ message: "Không tìm thấy comic" });
    }

    res.json({
      id: comic.comicId,
      title: comic.title,
      author: comic.author,
      cover: comic.coverImage,
      status: comic.status,
      description: comic.description,
      genres: comic.Genres.map(g => g.name),
      aliases: comic.AlternateNames.map(a => a.name),
      rating: parseFloat(comic.get("avgRating")) || 0,
      views: parseInt(comic.get("totalViews")) || 0,
      favorites: parseInt(comic.get("followerCount")) || 0,
      comments: parseInt(comic.get("commentCount")) || 0,
      createdAt: comic.createdAt,
      updatedAt: comic.updatedAt,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết comic:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = {
  getComicDetail,
};
