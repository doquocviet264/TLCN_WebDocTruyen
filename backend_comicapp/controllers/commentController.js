const { Comment, User, sequelize, Comic } = require('../models/index');
const { Op } = require('sequelize');

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
module.exports = {
    getCommentsByComic,
    createComment,
    toggleLikeComment,
    getRecentComments
};
