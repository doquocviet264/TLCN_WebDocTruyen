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

module.exports = { getAllGenres };
