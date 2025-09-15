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
            chapters: comic.Chapters.map(c => ({
                number: c.chapterNumber,
                title: c.title,
                time: c.createdAt 
            }))
        };

        res.json(responseData);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin truyện: ",error);
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

// Hàm lấy danh sách truyện mới cập nhật
const getNewlyUpdatedComics = async (req, res) => {
    try {
        const comics = await Comic.findAll({
            limit: 24,
            order: [['updatedAt', 'DESC']], // Sắp xếp theo ngày cập nhật mới nhất
            attributes: {
                include: [
                    'comicId', 'title', 'slug', 'author',
                    [sequelize.col('coverImage'), 'image'],
                    [sequelize.literal('(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)'), 'hearts'],
                    [sequelize.literal('(SELECT COUNT(*) FROM Comments WHERE Comments.comicId = Comic.comicId)'), 'comments'],
                    [sequelize.literal('(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)'), 'rating']
                ]
            },
            include: [
                {
                    model: Chapter,
                    attributes: ['chapterNumber', ['updatedAt', 'time']], //thành time
                    order: [['updatedAt', 'DESC']],
                    limit: 3, // Chỉ lấy 3 chương mới nhất cho mỗi truyện
                    separate: true
                }
            ]
        });

        res.json(comics);
    } catch (error) {
        console.error("Lỗi khi lấy truyện mới cập nhật:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
// Hàm lấy danh sách truyện đề cử
const getFeaturedComics = async (req, res) => {
    try {
        const comics = await Comic.findAll({
            limit: 10,
            attributes: [
                'comicId',
                'title',
                'slug',
                [sequelize.col('coverImage'), 'image'],
                // Đếm số người theo dõi và sắp xếp theo đó
                [sequelize.literal('(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)'), 'followerCount']
            ],
            include: [
                {
                    model: Chapter,
                    attributes: ['chapterNumber'],
                    order: [['chapterNumber', 'DESC']],
                    limit: 1, // Chỉ lấy chương mới nhất
                    separate: true,
                }
            ],
            order: [
                [sequelize.literal('followerCount'), 'DESC'] // Sắp xếp theo lượt theo dõi giảm dần
            ]
        });

        // Định dạng lại dữ liệu cho gọn gàng hơn
        const formattedComics = comics.map(comic => ({
            id: comic.comicId,
            title: comic.title,
            slug: comic.slug,
            image: comic.dataValues.image,
            chapter: comic.Chapters.length > 0 ? comic.Chapters[0].chapterNumber : null
        }));

        res.json(formattedComics);

    } catch (error) {
        console.error("Lỗi khi lấy truyện đề cử:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
// Hàm lấy dữ liệu cho các bảng xếp hạng
const getRankings = async (req, res) => {
    try {
        const limit = 10; // Lấy 10 truyện cho mỗi bảng xếp hạng

        // --- Hàm helper để tái sử dụng query ---
        const fetchRanking = (orderByField) => {
            return Comic.findAll({
                limit,
                attributes: [
                    'comicId', 'title', 'slug', 'createdAt',
                    [sequelize.col('coverImage'), 'image'],
                    [sequelize.literal('(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)'), 'followerCount'],
                    [sequelize.literal('(SELECT COUNT(*) FROM Chapters WHERE Chapters.comicId = Comic.comicId)'), 'viewCount'], // Giả định viewCount dựa trên số chương
                    [sequelize.literal('(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)'), 'rating']
                ],
                include: [{
                    model: Chapter,
                    attributes: ['chapterNumber'],
                    order: [['chapterNumber', 'DESC']],
                    limit: 1,
                    separate: true,
                }],
                order: [[sequelize.literal(orderByField), 'DESC']]
            });
        };

        // --- Lấy dữ liệu cho từng tab ---
        const [topComics, favoriteComics, newComics] = await Promise.all([
            fetchRanking('viewCount'),      // Top xem nhiều
            fetchRanking('followerCount'), // Top yêu thích
            fetchRanking('createdAt')      // Truyện mới nhất
        ]);

        // --- Hàm helper để định dạng dữ liệu ---
        const formatData = (comics) => comics.map((comic, index) => ({
            id: comic.comicId,
            rank: index + 1,
            slug: comic.slug,
            title: comic.title,
            image: comic.dataValues.image,
            rating: comic.get('rating') ? parseFloat(comic.get('rating')).toFixed(1) : '0',
            views: parseInt(comic.get('viewCount') || 0, 10),
            latestChapter: comic.Chapters.length > 0 ? `Chap ${comic.Chapters[0].chapterNumber}` : 'N/A',
            // trend có thể được tính toán phức tạp hơn, ở đây ta để mặc định
            trend: 'same' 
        }));

        res.json({
            top: formatData(topComics),
            favorites: formatData(favoriteComics),
            new: formatData(newComics)
        });

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu bảng xếp hạng:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
// Hàm lấy dữ liệu cho các mục ở trang chủ
const getHomepageSections = async (req, res) => {
    try {
        const limit = 10; // Số truyện mỗi mục

        // --- Hàm helper để tái sử dụng query lấy truyện ---
        const fetchComicsForSection = (options = {}) => {
            return Comic.findAll({
                limit,
                attributes: ['comicId', 'title', 'slug', [sequelize.col('coverImage'), 'image']],
                include: [{
                    model: Chapter,
                    attributes: ['chapterNumber'],
                    order: [['chapterNumber', 'DESC']],
                    limit: 1,
                    separate: true,
                }],
                ...options
            });
        };

        // 1. Lấy 3 thể loại ngẫu nhiên
        const randomGenres = await Genre.findAll({
            order: sequelize.random(),
            limit: 3
        });

        // 2. Lấy truyện cho từng thể loại ngẫu nhiên
        const genreSectionsPromises = randomGenres.map(genre => 
            fetchComicsForSection({
                include: [
                    { model: Chapter, attributes: ['chapterNumber'], order: [['chapterNumber', 'DESC']], limit: 1, separate: true },
                    { model: Genre, where: { genreId: genre.genreId }, attributes: [] }
                ]
            }).then(comics => ({ genre, comics })) // Gói cả genre và comics lại
        );
        
        // 3. Lấy truyện đã hoàn thành
        const completedSectionPromise = fetchComicsForSection({
            where: { status: 'Completed' },
            order: [['updatedAt', 'DESC']]
        }).then(comics => ({
            title: "Truyện Đã Hoàn Thành",
            comics
        }));

        // 4. Lấy truyện ngẫu nhiên
        const randomSectionPromise = fetchComicsForSection({
            order: sequelize.random()
        }).then(comics => ({
            title: "Gợi Ý Ngẫu Nhiên",
            comics
        }));

        // Chạy tất cả các promise song song để tăng tốc
        const [genreSections, completedSection, randomSection] = await Promise.all([
            Promise.all(genreSectionsPromises),
            completedSectionPromise,
            randomSectionPromise
        ]);

        res.json({
            genreSections,
            completedSection,
            randomSection
        });

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu các mục trang chủ:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};


module.exports = {
    getComicDetails,
    toggleFollow,
    getNewlyUpdatedComics,
    getFeaturedComics,
    getRankings,
    getHomepageSections
};
