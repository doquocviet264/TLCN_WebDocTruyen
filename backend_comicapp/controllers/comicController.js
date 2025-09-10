const { Comic, Genre, User, sequelize, Chapter } = require('../models/index');
const { Op } = require('sequelize');

// Lấy thông tin chi tiết truyện
const getComicDetails = async (req, res) => {
    try {
        const { slug } = req.params; // Lấy slug từ params
        const userId = req.user ? req.user.userId : null;

        const comic = await Comic.findOne({
            where: { slug }, // Tìm bằng slug
            attributes: [
                'comicId', 'title', 'slug', 'author', 'status', 'description',
                [sequelize.literal('coverImage'), 'image'],
                [sequelize.literal('updatedAt'), 'lastUpdate'],
            ],
            include: [
                {
                    model: Genre,
                    attributes: ['name'],
                    through: { attributes: [] }
                },
                {
                    model: Chapter,
                    attributes: ['chapterNumber', 'title', 'createdAt'],
                    separate: true,    
                    order: [['chapterNumber', 'DESC']],
                    limit: 100
                }
            ]
        });

        if (!comic) {
            return res.status(404).json({ message: 'Không tìm thấy truyện' });
        }
        
        // Lấy thông tin rating, follow tương tự như trước
        const followers = await comic.getFollowers();
        const ratings = await comic.getComicRatings();
        
        const followerCount = followers.length;
        const isFollowing = userId ? followers.some(f => f.userId === userId) : false;
        const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
        const rating = ratings.length > 0 ? (totalScore / ratings.length)  : 0; 

        const responseData = {
            id: comic.comicId,
            slug: comic.slug,
            title: comic.title,
            author: comic.author,
            image: comic.dataValues.image,
            lastUpdate: comic.dataValues.lastUpdate,
            status: comic.status,
            description: comic.description,
            genres: comic.Genres.map(g => g.name),
            rating: parseFloat(rating.toFixed(1)),
            reviewCount: ratings.length,
            followers: followerCount,
            isFollowing: isFollowing,
            chapters: comic.Chapters.map(c => ({ // Format lại chapters
                number: c.chapterNumber,
                title: c.title,
                time: c.createdAt // Bạn có thể format lại thời gian này ở FE
            }))
        };

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Theo dõi / Bỏ theo dõi truyện
const toggleFollow = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId; // từ middleware protect

    // Tìm comic theo slug
    const comic = await Comic.findOne({
      where: { slug },
      include: [{
        model: User,
        as: 'Followers', // tên association trong index.js
        attributes: ['userId'],
      }],
    });

    if (!comic) {
      return res.status(404).json({ message: 'Không tìm thấy truyện' });
    }

    // Kiểm tra xem user đã follow chưa
    const isFollowing = comic.Followers.some(f => f.id === userId);

    if (isFollowing) {
      // Hủy follow
      await comic.removeFollower(userId);
      return res.json({ message: 'Hủy theo dõi thành công', isFollowing: false });
    } else {
      // Follow
      await comic.addFollower(userId);
      return res.json({ message: 'Theo dõi thành công', isFollowing: true });
    }

  } catch (error) {
    console.error('Lỗi toggleFollow:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = {
    getComicDetails,
    toggleFollow
};
