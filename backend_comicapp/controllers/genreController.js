const db = require('../models'); // chỗ này trỏ tới folder models của bạn
const Genre = db.Genre; // model Genre

// Lấy tất cả genre
const getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.findAll({
      attributes: ['genreId', 'name'], // chọn cột bạn muốn trả về
      order: [['name', 'ASC']]
    });
    res.json(genres);
  } catch (error) {
    console.error("Lỗi khi lấy genres:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
// Lấy danh sách thể loại (có tìm kiếm + phân trang)
const getAllGenresForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    const whereClause = search
      ? { name: { [require("sequelize").Op.like]: `%${search}%` } }
      : {};

    const { count, rows } = await Genre.findAndCountAll({
      where: whereClause,
      order: [["genreId", "ASC"]],
      limit,
      offset,
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      genres: rows,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thể loại:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

//Thêm thể loại mới
const createGenre = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên thể loại không được để trống" });
    }

    const existing = await Genre.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ message: "Tên thể loại đã tồn tại" });
    }

    const newGenre = await Genre.create({ name: name.trim() });
    res.status(201).json({
      message: "Thêm thể loại thành công",
      genre: newGenre,
    });
  } catch (error) {
    console.error("Lỗi khi thêm thể loại:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

// Cập nhật thể loại
const updateGenre = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên thể loại không được để trống" });
    }

    const genre = await Genre.findByPk(id);
    if (!genre) {
      return res.status(404).json({ message: "Không tìm thấy thể loại" });
    }

    // Kiểm tra trùng tên
    const existing = await Genre.findOne({
      where: { name: name.trim(), genreId: { [require("sequelize").Op.ne]: id } },
    });
    if (existing) {
      return res.status(400).json({ message: "Tên thể loại đã tồn tại" });
    }

    genre.name = name.trim();
    await genre.save();

    res.json({ message: "Cập nhật thể loại thành công", genre });
  } catch (error) {
    console.error("Lỗi khi cập nhật thể loại:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};
module.exports = {
  getAllGenres,
  getAllGenresForAdmin,
  createGenre,
  updateGenre,
 };
