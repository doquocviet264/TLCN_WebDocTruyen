const express = require("express");
const router = express.Router();
const {getComicsForAdmin, updateComic, addComic, getComicByIdForAdmin,} = require("../controllers/comicController");
const { updateChapter,addChapter } = require("../controllers/chapterController");
const { getAllUsers,toggleUserStatus, promoteToAdmin } = require("../controllers/userController");
const { getAllReports, resolveReport, deleteReport } = require("../controllers/reportController");
const { getAllComments, deleteComment } = require("../controllers/commentController");
const { getAllGenresForAdmin, createGenre, updateGenre } = require("../controllers/genreController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

//Lấy danh sách truyện cho trang quản lý
router.get("/comics", protect, isAdmin, getComicsForAdmin);

//Thêm truyện mới
router.post("/comics", protect, isAdmin, addComic);

//Cập nhật thông tin truyện
router.put("/comics/:id", protect, isAdmin, updateComic);
//Lấy chi tiết truyện
router.get("/comics/:id", protect, isAdmin, getComicByIdForAdmin);
router.put("/chapters/:id", updateChapter);
//Thêm chương mới
router.post("/comics/:comicId/chapters", protect, isAdmin, addChapter);
//Lấy danh sách người dùng
router.get("/users", protect, isAdmin, getAllUsers);
//Thăng cấp người dùng thành admin  
router.patch("/users/:userId/promote", protect, isAdmin, promoteToAdmin);
//Khoá/mở khoá người dùng
router.patch("/users/:userId/:action", protect, isAdmin, toggleUserStatus);
//Lấy danh sách tất cả báo cáo
router.get("/reports", protect, isAdmin, getAllReports);
// Giải quyết báo cáo
router.patch("/reports/:id/resolve", protect, isAdmin, resolveReport);
//Xoá báo cáo (xóa)
router.delete("/reports/:id", protect, isAdmin, deleteReport);
//Lấy danh sách tất cả bình luận
router.get("/comments", protect, isAdmin, getAllComments);
//Xoá bình luận (Admin) và gửi thông báo cho người dùng
router.delete("/comments/:id", protect, isAdmin, deleteComment);
//Lấy danh sách thể loại (có tìm kiếm + phân trang)
router.get("/genres", protect, isAdmin, getAllGenresForAdmin);
//Thêm thể loại mới
router.post("/genres", protect, isAdmin, createGenre);
// Cập nhật thể loại
router.put("/genres/:id", protect, isAdmin, updateGenre);
module.exports = router;
