const { Report, User, Comment, Chapter, Comic } = require("../models");
const { Op } = require("sequelize");

// Lấy danh sách tất cả báo cáo
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["userId", "username", "email", "avatar"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        let target = null;

        if (report.type === "comment" && report.targetId) {
          target = await Comment.findByPk(report.targetId, {
            attributes: ["content", "createdAt"],
            include: [
              { model: User, attributes: ["username"]},
            ],
          });
        } else if (report.type === "chapter" && report.targetId) {
          target = await Chapter.findByPk(report.targetId, {
            attributes: ["title", "chapterNumber"],
            include: [
              { model: Comic, attributes: ["title"]},
            ],
          });
        }

        return {
          ...report.toJSON(),
          target,
        };
      })
    );

    res.json({ reports: enrichedReports, totalReports: enrichedReports.length });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách báo cáo:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Giải quyết báo cáo
const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({ message: "Không tìm thấy báo cáo" });
    }

    report.isResolved = true;
    report.resolvedAt = new Date();
    await report.save();

    res.json({ message: "Đã đánh dấu báo cáo là đã giải quyết" });
  } catch (error) {
    console.error("Lỗi khi cập nhật báo cáo:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

//Xoá báo cáo (xóa)
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Report.destroy({ where: { reportId: id } });

    if (!deleted) return res.status(404).json({ message: "Không tìm thấy báo cáo" });

    res.json({ message: "Đã xóa báo cáo" });
  } catch (error) {
    console.error("Lỗi khi xóa báo cáo:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
const createReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, type, category, reportId } = req.body;

    if (!title || !description || !type || !category) {
      return res.status(400).json({ message: "Thiếu thông tin báo cáo" });
    }

    const report = await Report.create({
      title,
      description,
      type,
      reportId,
      re,
      userId,
      isResolved: false,
    });

    res.status(201).json({
      message: "Báo cáo đã được gửi thành công",
      report,
    });
  } catch (error) {
    console.error("Lỗi khi tạo báo cáo:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

module.exports = { 
  getAllReports, 
  resolveReport, 
  deleteReport,
  createReport
};
