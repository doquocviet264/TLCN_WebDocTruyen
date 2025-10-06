const { User, Notification } = require('../models/index');
const { Op } = require('sequelize');
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Tính thời điểm 1 tháng trước
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);

        const notifications = await Notification.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.between]: [oneMonthAgo, now] 
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 100 // chỉ lấy tối đa 100 bản ghi
        });

        res.status(200).json({ notifications });
    } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
}

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { notificationId } = req.params;
        const notification = await Notification.findOne({ where: { notificationId, userId } });
        if (!notification) {
            return res.status(404).json({ message: "Không tìm thấy thông báo" });
        }
        notification.isRead = true;
        await notification.save();
        console.log(`User ${userId} đánh dấu thông báo ${notificationId} đã đọc`);
        res.status(200).json({ message: "Đánh dấu đã đọc thành công" });
    } catch (error) {
        console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
}

const maskAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
        res.status(200).json({ message: "Đánh dấu tất cả đã đọc thành công" });
    } catch (error) {
        console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
}



module.exports = { getNotifications, markAsRead, maskAllAsRead };
