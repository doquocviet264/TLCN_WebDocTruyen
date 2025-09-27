const { Comic, Genre, User, sequelize, Chapter, ComicRating } = require('../models/index');
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
                    attributes: ['chapterId', 'chapterNumber', 'title', 'views', 'isLocked', 'updatedAt'],
                    separate: true,    
                    order: [['chapterNumber', 'DESC']],
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
                id: c.chapterId,
                number: c.chapterNumber,
                title: c.title,
                views: c.views,
                isLocked: c.isLocked,
                time: c.updatedAt
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
                    [sequelize.literal('(SELECT COUNT(*) FROM Chapters WHERE Chapters.comicId = Comic.comicId)'), 'viewCount'],
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
        const formatData = (comics) => comics.map((comic, index) => {
            const lastChapterNumber = comic.Chapters.length > 0
                ? Number(comic.Chapters[0].chapterNumber) // tự động bỏ .00
                : null;

            return {
                id: comic.comicId,
                rank: index + 1,
                slug: comic.slug,
                title: comic.title,
                image: comic.dataValues.image,
                rating: comic.get('rating') ? parseFloat(comic.get('rating')).toFixed(1) : '0',
                views: parseInt(comic.get('viewCount') || 0, 10),
                latestChapter: lastChapterNumber !== null
                    ? `Chương ${lastChapterNumber}`
                    : 'N/A',
                trend: 'same'
            };
        });

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
        const fetchComicsForSection = async (options = {}) => {
            const comics = await Comic.findAll({
                limit,
                attributes: ['comicId', 'title', 'slug', 'coverImage'],
                include: [
                    {
                        model: Chapter,
                        attributes: ['chapterNumber'],
                        order: [['chapterNumber', 'DESC']],
                        limit: 1,
                        separate: true,
                    }
                ],
                ...options
            });

            // Map lại dữ liệu để chỉ lấy lastChapter
            return comics.map(c => ({
                comicId: c.comicId,
                title: c.title,
                slug: c.slug,
                image: c.coverImage,
                lastChapter: c.Chapters?.[0]?.chapterNumber || null
            }));
        };

        //Lấy 3 thể loại ngẫu nhiên
        const randomGenres = await Genre.findAll({
            order: sequelize.random(),
            limit: 3
        });

        //Lấy truyện cho từng thể loại ngẫu nhiên
        const genreSectionsPromises = randomGenres.map(genre => 
            fetchComicsForSection({
                include: [
                    { model: Chapter, attributes: ['chapterNumber'], order: [['chapterNumber', 'DESC']], limit: 1, separate: true },
                    { model: Genre, where: { genreId: genre.genreId }, attributes: [] }
                ]
            }).then(comics => ({ genre, comics })) // Gói cả genre và comics lại
        );
        
        //Lấy truyện đã hoàn thành
        const completedSectionPromise = fetchComicsForSection({
            where: { status: 'Completed' },
            order: [['updatedAt', 'DESC']]
        }).then(comics => ({
            title: "Truyện Đã Hoàn Thành",
            comics
        }));

        //Lấy truyện ngẫu nhiên
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



const getComicDetailForHistory = async (req, res) => {
    try {
        const { comicId } = req.params; // Lấy id từ params

        const comic = await Comic.findOne({
            where: { comicId }, // Tìm bằng id
            attributes: [
                'title', 'slug', 
                [sequelize.literal('coverImage'), 'image'],
            ],
        });

        if (!comic) {
            return res.status(404).json({ message: 'Không tìm thấy truyện' });
        }
        

        const responseData = {
            slug: comic.slug,
            title: comic.title,
            image: comic.dataValues.image,
        };

        res.json(responseData);
    } catch (error) {
        console.error("Lỗi khi lấy thông tin truyện cho lịch sử: ",error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Hàm tìm kiếm truyện với nhiều bộ lọc
const searchComics = async (req, res) => {
  try {
    const {
      q = '',
      genres = '',
      status = 'all',
      country = 'all',
      sortBy = 'newest',
      page = 1,
      limit = 40
    } = req.query;

    const statusMap = {
      'Đang cập nhật': 'In Progress',
      'Tạm ngưng': 'On Hold',
      'Hoàn thành': 'Completed'
    };

    const where = {};

    // Tìm theo tên hoặc tác giả
    if (q) {
      where[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { author: { [Op.like]: `%${q}%` } }
      ];
    }

    // Lọc theo trạng thái
    if (status !== 'all' && statusMap[status]) {
      where.status = statusMap[status];
    }

    // Lọc theo thể loại
    let genreFilter = [];
    if (genres) {
      genreFilter = genres.split(',').map(genre => genre.trim());
    }

    // Lọc theo quốc gia
    const countryGenres = {
      'nhat-ban': 'Manga',
      'han-quoc': 'Manhwa',
      'trung-quoc': 'Manhua',
      'my': 'Comic',
      'viet-nam': 'Việt Nam'
    };

    // TẤT CẢ thể loại bắt buộc (thể loại thường + thể loại quốc gia)
    let allRequiredGenres = [...genreFilter];
    if (country !== 'all' && countryGenres[country]) {
      allRequiredGenres.push(countryGenres[country]);
    }

    // Xử lý sort
    let order = [['createdAt', 'DESC']];
    switch (sortBy) {
      case 'rating':
        order = [[sequelize.literal('rating'), 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'popular':
        order = [[sequelize.literal('chapters'), 'DESC']];
        break;
    }

    const offset = (page - 1) * limit;

    // Tìm comic IDs có TẤT CẢ thể loại yêu cầu
    let comicIdsWithAllGenres = [];
    
    if (allRequiredGenres.length > 0) {
      const genreResults = await Comic.findAll({
        include: [{
          model: Genre,
          where: { name: { [Op.in]: allRequiredGenres } },
          through: { attributes: [] },
          attributes: []
        }],
        attributes: ['comicId'],
        group: ['Comic.comicId'],
        having: sequelize.where(
          sequelize.fn('COUNT', sequelize.col('Genres.genreId')),
          { [Op.gte]: allRequiredGenres.length }
        ),
        raw: true
      });
      
      comicIdsWithAllGenres = genreResults.map(result => result.comicId);
      
      // Nếu không có comic nào thỏa mãn tất cả thể loại, trả về kết quả rỗng
      if (comicIdsWithAllGenres.length === 0) {
        return res.json({
          comics: [],
          totalComics: 0,
          totalPages: 0,
          currentPage: parseInt(page)
        });
      }
      
      // Thêm điều kiện comicId vào where
      where.comicId = { [Op.in]: comicIdsWithAllGenres };
    }

    const { count, rows } = await Comic.findAndCountAll({
      where,
      include: [
        {
          model: Genre,
          through: { attributes: [] },
          attributes: ['name']
        },
        {
          model: Chapter,
          attributes: ['chapterNumber'],
          order: [['chapterNumber', 'DESC']],
          limit: 1,
          separate: true
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)'
            ),
            'rating'
          ],
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM Chapters WHERE Chapters.comicId = Comic.comicId)'
            ),
            'chapters'
          ]
        ]
      },
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const comics = rows.map(comic => {
      return {
        id: comic.comicId,
        slug: comic.slug,
        title: comic.title,
        image: comic.coverImage,
        lastChapter: comic.Chapters.length > 0 ? comic.Chapters[0].chapterNumber : null,
      };
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      comics,
      totalComics: count,
      totalPages,
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm truyện:', error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};


module.exports = {
    getComicDetails,
    toggleFollow,
    getNewlyUpdatedComics,
    getFeaturedComics,
    getRankings,
    getHomepageSections,
    getComicDetailForHistory,
    searchComics
};
