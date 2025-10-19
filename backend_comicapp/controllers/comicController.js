const { Comic, Genre, User, sequelize, Chapter, ComicRating, AlternateName, ChapterImage  } = require('../models/index');
const { Op, fn } = require('sequelize');
const { Sequelize } = require('sequelize');
const cloudinary = require("../config/cloudinary");
const { slugify } = require("transliteration"); // cài npm i transliteration


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
        const likers = await comic.getLikers();
        const followerCount = followers.length;
        const likerCount = likers.length;
        const isFollowing = userId ? followers.some(f => f.userId === userId) : false;
        const isFavorite = userId ? likers.some(f => f.userId === userId) : false;
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
            likers: likerCount,
            isFavorite: isFavorite,
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
    const isFollowing = comic.Followers.some(f => f.userId === userId);

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
// Theo dõi / Bỏ theo dõi truyện
const toggleLike = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId; // từ middleware protect

    // Tìm comic theo slug
    const comic = await Comic.findOne({
      where: { slug },
      include: [{
        model: User,
        as: 'Likers', // tên association trong index.js
        attributes: ['userId'],
      }],
    });

    if (!comic) {
      return res.status(404).json({ message: 'Không tìm thấy truyện' });
    }

    // Kiểm tra xem user đã like chưa
    const isFavorite = comic.Likers.some(u => u.userId === userId);

    if (isFavorite) {
      // Hủy like
      await comic.removeLiker(userId);
      return res.json({ message: 'Hủy thích thành công', isFavorite: false });
    } else {
      // like
      await comic.addLiker(userId);
      return res.json({ message: 'Thích thành công', isFavorite: true });
    }

  } catch (error) {
    console.error('Lỗi toggleLike:', error);
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

const getFollowedComics = async (req, res) => {
    try {
        const userId = req.user.userId; // Lấy userId từ middleware xác thực

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        // Sử dụng magic method `getFollowingComics` và thêm subquery phức tạp
        const followedComics = await user.getFollowingComics({
            attributes: [
                ['comicId', 'id'],
                'title',
                'slug',
                ['coverImage', 'image'],
                [
                    // Sử dụng Sequelize.literal để viết subquery SQL thuần
                    // Logic: Ưu tiên lấy chapter cuối cùng người dùng đã đọc, nếu không có thì lấy chapter đầu tiên của truyện
                    Sequelize.literal(`
                        COALESCE(
                            (SELECT ch.chapterNumber 
                             FROM ReadingHistory rh 
                             JOIN Chapters ch ON rh.chapterId = ch.chapterId 
                             WHERE rh.userId = ${userId} AND rh.comicId = \`ComicFollows\`.\`comicId\` 
                             ORDER BY rh.lastReadAt DESC 
                             LIMIT 1),
                            (SELECT MIN(ch2.chapterNumber) 
                             FROM Chapters ch2 
                             WHERE ch2.comicId = \`ComicFollows\`.\`comicId\`)
                        )
                    `),
                    'lastChapter' // Đặt tên cho kết quả của subquery là 'lastChapter'
                ]
            ],
            joinTableAttributes: [], // Không lấy thông tin từ bảng trung gian ComicFollows
            order: [[Sequelize.literal('`ComicFollows`.`followDate`'), 'DESC']] // Sắp xếp theo ngày theo dõi mới nhất
        });
        
        // Chuyển đổi kết quả để có cấu trúc phẳng và thêm chapterTitle
        const result = followedComics.map(comic => {
            const plainComic = comic.get({ plain: true });
            const lastChapterNumber = plainComic.lastChapter || '1'; // Mặc định là 1 nếu truyện chưa có chapter nào

            return {
                id: plainComic.id,
                title: plainComic.title,
                slug: plainComic.slug,
                image: plainComic.image,
                lastChapter: lastChapterNumber,
                chapterTitle: `Chương ${lastChapterNumber}`
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách theo dõi:', error);
        res.status(500).json({ message: 'Lỗi máy chủ ' });
    }
};

// Hàm lấy các truyện liên quan dựa trên thể loại
const getRelatedComics = async (req, res) => {
    try {
        const { slug } = req.params;
        const limit = parseInt(req.query.limit) || 12; // Số lượng truyện liên quan muốn lấy

        // Lấy thông tin truyện hiện tại để lấy thể loại
        const currentComic = await Comic.findOne({
            where: { slug },
            include: [{
                model: Genre,
                attributes: ['genreId'],
                through: { attributes: [] }
            }]
        });

        if (!currentComic) {
            return res.status(404).json({ message: 'Không tìm thấy truyện' });
        }

        // Lấy danh sách genreId của truyện hiện tại
        const currentGenreIds = currentComic.Genres.map(genre => genre.genreId);

        if (currentGenreIds.length === 0) {
            return res.json([]); // Trả về mảng rỗng nếu truyện không có thể loại
        }

        // Tìm các truyện có chung thể loại (không bao gồm truyện hiện tại)
        const relatedComics = await Comic.findAll({
            where: {
                comicId: {
                    [Op.ne]: currentComic.comicId // Loại trừ truyện hiện tại
                }
            },
            include: [
                {
                    model: Genre,
                    where: {
                        genreId: {
                            [Op.in]: currentGenreIds // Chỉ lấy truyện có chung thể loại
                        }
                    },
                    through: { attributes: [] },
                    attributes: []
                },
                {
                    model: Chapter,
                    attributes: ['chapterNumber'],
                    order: [['chapterNumber', 'DESC']],
                    limit: 1,
                    separate: true
                }
            ],
            attributes: [
                'comicId',
                'title',
                'slug',
                'updatedAt',
                [sequelize.col('coverImage'), 'image'],
                [sequelize.literal(`(SELECT SUM(c.views) FROM Chapters c WHERE c.comicId = Comic.comicId)`), "totalViews"],
                [sequelize.literal('(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)'), 'rating'],
                [sequelize.literal('(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)'), 'followerCount']
            ],
            order: [
                // Ưu tiên truyện có nhiều thể loại chung trước
                [sequelize.literal(`(
                    SELECT COUNT(*) 
                    FROM GenreComic 
                    WHERE GenreComic.comicId = Comic.comicId 
                    AND GenreComic.genreId IN (${currentGenreIds.join(',')})
                )`), 'DESC'],
                // Sau đó sắp xếp theo rating
                [sequelize.literal('rating'), 'DESC'],
                // Cuối cùng là số người theo dõi
                [sequelize.literal('followerCount'), 'DESC']
            ],
            limit: limit
        });

        // Định dạng dữ liệu trả về
        const formattedComics = relatedComics.map(comic => ({
            id: comic.comicId,
            title: comic.title,
            slug: comic.slug,
            image: comic.dataValues.image,
            views: parseInt(comic.get('totalViews')),
            rating: comic.get('rating') ? parseFloat(comic.get('rating')).toFixed(1) : '0',
            lastChapter: comic.Chapters.length > 0 ? comic.Chapters[0].chapterNumber : null,
            latestChapterTime: comic.updatedAt,
        }));

        res.json(formattedComics);

    } catch (error) {
        console.error("Lỗi khi lấy truyện liên quan:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// Lấy danh sách truyện cho trang quản lý
const getComicsForAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 30 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    const { count, rows } = await Comic.findAndCountAll({
      include: [
        { model: Genre, attributes: ["name"], through: { attributes: [] } },
        { model: sequelize.models.AlternateName, as: "AlternateNames", attributes: ["name"] },
      ],
      attributes: {
        include: [
          [sequelize.literal("(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"), "followerCount"],
          [sequelize.literal("(SELECT SUM(views) FROM Chapters WHERE Chapters.comicId = Comic.comicId)"), "totalViews"],
          [sequelize.literal("(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"), "avgRating"],
        ],
      },
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const comics = rows.map((comic) => ({
      id: comic.comicId,
      title: comic.title,
      slug: comic.slug,
      author: comic.author,
      image: comic.coverImage,
      status: comic.status,
      genres: comic.Genres.map((g) => g.name),
      aliases: comic.AlternateNames.map((a) => a.name),
      description: comic.description,
      followers: parseInt(comic.get("followerCount")) || 0,
      views: parseInt(comic.get("totalViews")) || 0,
      rating: comic.get("avgRating") ? parseFloat(comic.get("avgRating")).toFixed(1) : "0",
      updatedAt: comic.updatedAt,
      createdAt: comic.createdAt,
    }));

    res.json({
      comics,
      totalComics: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách truyện quản lý:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Cập nhật thông tin truyện
const updateComic = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { title, author, status, description, image, genres, aliases } = req.body;

    // Lấy comic cần update
    const comic = await Comic.findByPk(id, { transaction: t });
    if (!comic) {
      await t.rollback();
      return res.status(404).json({ message: "Không tìm thấy comic" });
    }

    // Xử lý ảnh (base64 -> Cloudinary hoặc giữ URL)
    let coverImageUrl = comic.coverImage;
    if (image) {
      if (image.startsWith("data:")) {
        const upload = await cloudinary.uploader.upload(image, { folder: "comics" });
        coverImageUrl = upload.secure_url;
      } else if (image.startsWith("http")) {
        coverImageUrl = image;
      }
    }

    // Update các field cơ bản
    await comic.update(
      { title, author, status, description, coverImage: coverImageUrl },
      { transaction: t }
    );

    // Update Genres (Many-to-Many)
    if (Array.isArray(genres)) {
      const genreRecords = await Genre.findAll({
        where: { name: { [Op.in]: genres } },
        transaction: t,
      });
      await comic.setGenres(genreRecords, { transaction: t });
    }

    // Update AlternateNames (One-to-Many)
    if (Array.isArray(aliases)) {
      const oldAliases = await AlternateName.findAll({
        where: { comicId: id },
        transaction: t,
      });

      const oldNames = oldAliases.map((a) => a.name);
      const newNames = aliases;

      // Xóa alias không còn
      const toDelete = oldNames.filter((n) => !newNames.includes(n));
      if (toDelete.length > 0) {
        await AlternateName.destroy({
          where: { comicId: id, name: toDelete },
          transaction: t,
        });
      }

      // Thêm alias mới
      const toAdd = newNames.filter((n) => !oldNames.includes(n));
      if (toAdd.length > 0) {
        const newAliasData = toAdd.map((name) => ({ comicId: id, name }));
        await AlternateName.bulkCreate(newAliasData, { transaction: t });
      }
    }

    await t.commit();

    // Lấy comic sau khi cập nhật kèm quan hệ
    const updatedComic = await Comic.findByPk(id, {
      include: [
        { model: Genre, attributes: ["name"], through: { attributes: [] } },
        { model: AlternateName, attributes: ["name"] },
      ],
    });

    res.json({ message: "Cập nhật comic thành công", comic: updatedComic });
  } catch (error) {
    await t.rollback();
    console.error("Lỗi update comic:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
async function processImage(image, oldImage) {
  let coverImageUrl = oldImage;
  if (image) {
    if (image.startsWith("data:")) {
      const upload = await cloudinary.uploader.upload(image, { folder: "comics" });
      coverImageUrl = upload.secure_url;
    } else if (image.startsWith("http")) {
      coverImageUrl = image;
    }
  }
  return coverImageUrl;
}
async function generateUniqueSlug(title, Comic) {
  let baseSlug = slugify(title, { lowercase: true, separator: "-" });
  let slug = baseSlug;
  let counter = 1;

  // kiểm tra trùng slug trong DB
  while (await Comic.findOne({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
}
// Thêm comic
const addComic = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { title, author, status, description, image, genres = [], aliases = [] } = req.body;
    if (!genres || genres.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Truyện phải có ít nhất một thể loại" });
    }
    if (!description || description.trim() === "") {
      await t.rollback();
      return res.status(400).json({ message: "Mô tả truyện không được để trống" });
    }
    if (!title || title.trim() === "") {
      await t.rollback();
      return res.status(400).json({ message: "Tiêu đề truyện không được để trống" });
    }
    // check title đã tồn tại chưa
    const existed = await Comic.findOne({ where: { title } });
    if (existed) {
      await t.rollback();
      return res.status(400).json({ message: "Tên truyện đã tồn tại" });
    }

    // tạo slug duy nhất
    const slug = await generateUniqueSlug(title, Comic);

    // xử lý ảnh (Cloudinary)
    let coverImageUrl = null;
    if (image) {
      if (image.startsWith("data:")) {
        const upload = await cloudinary.uploader.upload(image, { folder: "comics" });
        coverImageUrl = upload.secure_url;
      } else {
        coverImageUrl = image;
      }
    }
    // tạo comic
    const comic = await Comic.create({
      title,
      author: author ? author : "Đang cập nhật",
      status,
      description,
      coverImage: coverImageUrl,
      slug
    }, { transaction: t });

    // Genres
    if (genres.length > 0) {
      const genreRecords = await Genre.findAll({
        where: { name: { [Op.in]: genres } },
        transaction: t,
      });
      await comic.setGenres(genreRecords, { transaction: t });
    }

    // Aliases
    for (const name of aliases) {
      await AlternateName.create({ comicId: comic.comicId, name }, { transaction: t });
    }

    await t.commit();

    const newComic = await Comic.findByPk(comic.comicId, {
      include: [
        { model: Genre, attributes: ["name"], through: { attributes: [] } },
        { model: AlternateName, attributes: ["name"] },
      ],
    });

    res.json({ message: "Thêm comic thành công", comic: newComic });
  } catch (err) {
    await t.rollback();
    console.error("Lỗi thêm comic:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
//  lấy chi tiết 1 comic cho admin
const getComicByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const comic = await Comic.findByPk(id, {
      include: [
        { model: Genre, attributes: ["name"], through: { attributes: [] } },
        { model: AlternateName, attributes: ["name"] },
        {
          model: Chapter,
          attributes: [
            "chapterId",
            "chapterNumber",
            "title",
            "cost",
            "isLocked",
            "views",
            "updatedAt",
            "createdAt",
          ],
          include: [
            {
              model: ChapterImage,
              attributes: ["imageId", "imageUrl", "pageNumber"],
              order: [["pageNumber", "ASC"]],
            },
          ],
        },
      ],
      attributes: {
        include: [
          [
            sequelize.literal(
              "(SELECT COUNT(*) FROM ComicFollows WHERE ComicFollows.comicId = Comic.comicId)"
            ),
            "followerCount",
          ],
          [
            sequelize.literal(
              "(SELECT SUM(views) FROM Chapters WHERE Chapters.comicId = Comic.comicId)"
            ),
            "totalViews",
          ],
          [
            sequelize.literal(
              "(SELECT AVG(score) FROM ComicRatings WHERE ComicRatings.comicId = Comic.comicId)"
            ),
            "avgRating",
          ],
        ],
      },
    });

    if (!comic) return res.status(404).json({ message: "Không tìm thấy comic" });

    res.json({
      id: comic.comicId,
      title: comic.title,
      slug: comic.slug,
      author: comic.author,
      image: comic.coverImage,
      status: comic.status,
      description: comic.description,
      genres: comic.Genres.map((g) => g.name),
      aliases: comic.AlternateNames.map((a) => a.name),
      followers: parseInt(comic.get("followerCount")) || 0,
      views: parseInt(comic.get("totalViews")) || 0,
      rating: comic.get("avgRating")
        ? parseFloat(comic.get("avgRating")).toFixed(1)
        : "0",
      createdAt: comic.createdAt,
      updatedAt: comic.updatedAt,
      chapters: comic.Chapters.map((c) => ({
        id: c.chapterId,
        number: c.chapterNumber,
        title: c.title,
        views: c.views,
        cost: c.cost,
        isLocked: c.isLocked,
        publishDate: c.createdAt,
        updatedAt: c.updatedAt,
        images: c.ChapterImages
          ? c.ChapterImages.map((img) => ({
              id: img.imageId,
              url: img.imageUrl,
              pageNumber: img.pageNumber,
            }))
          : [],
      })),
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};


module.exports = {
    getComicDetails,
    toggleFollow,
    toggleLike,
    getNewlyUpdatedComics,
    getFeaturedComics,
    getRankings,
    getHomepageSections,
    getComicDetailForHistory,
    searchComics,
    getFollowedComics,
    getRelatedComics,
    getComicsForAdmin,
    updateComic,
    addComic,
    getComicByIdForAdmin
};
