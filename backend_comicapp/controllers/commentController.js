const { Comment, User, sequelize, Comic, Notification } = require('../models/index');
const { Op } = require('sequelize');
const { updateQuestProgress } = require('../services/updateQuestService');
// Lấy bình luận có phân trang
const getCommentsByComic = async (req, res) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const userId = req.user ? req.user.userId : null;

        const { count, rows } = await Comment.findAndCountAll({
            include: [
                {
                    model: Comic,
                    attributes: [],
                    where: { slug } // lọc comic theo slug
                },
                { model: User, attributes: ['username'] },
                {
                    model: Comment,
                    as: 'replies',
                    include: [{ model: User, attributes: ['username'] }]
                }
            ],
            where: { parentId: null },
            attributes: [
                'commentId', 'content', 'createdAt',
                [sequelize.literal(`(SELECT COUNT(*) FROM CommentLikes WHERE CommentLikes.commentId = Comment.commentId)`), 'likes'],
                [sequelize.literal(`(EXISTS(SELECT 1 FROM CommentLikes WHERE CommentLikes.commentId = Comment.commentId AND CommentLikes.userId = ${userId || 'NULL'}))`), 'isLiked']
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true
        });

        res.json({
            totalItems: count,
            comments: rows.map(c => c.get({ plain: true })),
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bình luận cho truyện",error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Tạo bình luận mới
const createComment = async (req, res) => {
    try {
        const { comicId, content, parentId } = req.body;
        const userId = req.user.userId;

        if (!content) {
            return res.status(400).json({ message: 'Nội dung bình luận là bắt buộc' });
        }

        const newComment = await Comment.create({
            comicId,
            userId,
            content,
            parentId,
        });

        // Trả về comment mới kèm thông tin user
        const result = await Comment.findByPk(newComment.commentId, {
            include: [{ model: User, attributes: ['username'] }]
        });
        await updateQuestProgress(userId, 'comment');
        res.status(201).json(result.get({ plain: true }));
    } catch (error) {
        console.error("Lỗi khi tạo bình luận",error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// Like/Unlike bình luận
const toggleLikeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.userId;

        const CommentLike = sequelize.models.CommentLikes;
        const existingLike = await CommentLike.findOne({ where: { userId, commentId } });

        if (existingLike) {
            await existingLike.destroy();
            res.json({ liked: false, message: 'Bỏ thích thành công' });
        } else {
            await CommentLike.create({ userId, commentId });
            res.json({ liked: true, message: 'Thích thành công' });
        }
    } catch (error) {
        console.error("Lỗi khi thích hoặc không thích:", error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};
// Hàm lấy các bình luận gần đây nhất 
const getRecentComments = async (req, res) => {
    try {
        const comments = await Comment.findAll({
            limit: 10, // Lấy 10 bình luận mới nhất
            where: { parentId: null }, // Chỉ lấy các bình luận gốc, không lấy trả lời
            order: [['createdAt', 'DESC']],
            attributes: ['commentId', 'content', 'createdAt'],
            include: [
                {
                    model: User,
                    attributes: ['username', 'avatar'], // Lấy thông tin người dùng
                },
                {
                    model: Comic,
                    attributes: ['title', 'slug'], // Lấy thông tin truyện để tạo link
                }
            ]
        });

        res.json(comments);
    } catch (error) {
        console.error("Lỗi khi lấy bình luận gần đây:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};
// Lấy tất cả bình luận (Admin)
const getAllComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ["userId", "username", "email", "avatar"],
        },
        {
          model: Comic,
          attributes: ["comicId", "title"],
        },
      ],
      attributes: [
        "commentId",
        "content",
        "createdAt",
        "comicId",
        "parentId",
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM CommentLikes WHERE CommentLikes.commentId = Comment.commentId)`
          ),
          "likes",
        ],
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM Reports WHERE Reports.targetId = Comment.commentId AND Reports.type = 'comment')`
          ),
          "reports",
        ],
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    // Chuẩn hóa dữ liệu trả về
    const formattedComments = rows.map((c) => {
      const data = c.get({ plain: true });
      return {
        id: data.commentId,
        content: data.content,
        createdAt: data.createdAt,
        likes: parseInt(data.likes) || 0,
        reports: parseInt(data.reports) || 0,
        mangaTitle: data.Comic ? data.Comic.title : "Không xác định",
        chapterNumber: null, // Nếu bạn muốn bổ sung sau
        user: {
          name: data.User?.username || "Ẩn danh",
          email: data.User?.email || "",
          avatar: data.User?.avatar || null,
        },
      };
    });

    res.json({
      totalItems: count,
      comments: formattedComments,
      totalComments: formattedComments.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Lỗi khi lấy tất cả bình luận:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Xóa bình luận (Admin) và gửi thông báo cho người dùng
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra bình luận tồn tại
    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: "Không tìm thấy bình luận." });
    }

    await sequelize.transaction(async (t) => {
      // Xóa like
      await sequelize.models.CommentLikes.destroy({
        where: { commentId: id },
        transaction: t,
      });

      // Xóa reply
      await Comment.destroy({
        where: { parentId: id },
        transaction: t,
      });

      // Xóa report
      if (sequelize.models.Report) {
        await sequelize.models.Report.destroy({
          where: { targetId: id, type: "comment" },
          transaction: t,
        });
      }

      // Xóa comment chính
      await comment.destroy({ transaction: t });

      // 🔔 Gửi thông báo cho người dùng
      await Notification.create({
        userId: comment.userId,
        category: "comment",
        title: "Bình luận của bạn đã bị xóa",
        message:
          "Bình luận của bạn đã bị quản trị viên xóa do vi phạm quy định.",
      }, { transaction: t });
    });

    res.json({ message: "Đã xóa bình luận và gửi thông báo cho người dùng." });
  } catch (error) {
    console.error("Lỗi khi xóa bình luận:", error);
    res.status(500).json({ message: "Lỗi máy chủ." });
  }
};

module.exports = { deleteComment };

module.exports = {
    getCommentsByComic,
    createComment,
    toggleLikeComment,
    getRecentComments,
    getAllComments,
    deleteComment
};
