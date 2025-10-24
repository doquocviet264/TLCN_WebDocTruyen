// app/services/genre.service.js
const AppError = require("../utils/AppError");

module.exports = ({ model, genreRepo }) => {
  const { Op } = model.Sequelize;

  return {
    // Public: GET /genres
    async listPublic() {
      const rows = await genreRepo.findAll(
        { attributes: ["genreId", "name"] },
        { model }
        );
      return rows;
    },

    // Admin: GET /genres/admin?page=&search=
    async listAdmin({ page = 1, limit = 10, search = "" }) {
      const offset = (page - 1) * limit;
      const where = search ? { name: { [Op.like]: `%${search.trim()}%` } } : {};
      const { count, rows } = await genreRepo.findAndCountAll(
        { where, limit, offset, order: [["genreId", "ASC"]] },
        { model }
      );

      return {
        rows,
        meta: {
          page,
          limit,
          total: count,
          totalPages: Math.max(1, Math.ceil(count / limit)),
        },
      };
    },

    // Admin: POST /genres/admin
    async create({ name }) {
      const trimmed = (name || "").trim();
      if (!trimmed) throw new AppError("Tên thể loại không được để trống", 400, "VALIDATION_ERROR");

      const exists = await genreRepo.findOne({ name: trimmed }, { model });
      if (exists) throw new AppError("Tên thể loại đã tồn tại", 400, "GENRE_EXISTS");

      const created = await genreRepo.create({ name: trimmed }, { model });
      return created;
    },

    // Admin: PUT /genres/admin/:id
    async update({ id, name }) {
      const trimmed = (name || "").trim();
      if (!trimmed) throw new AppError("Tên thể loại không được để trống", 400, "VALIDATION_ERROR");

      const genre = await genreRepo.findByPk(id, { model });
      if (!genre) throw new AppError("Không tìm thấy thể loại", 404, "GENRE_NOT_FOUND");

      const dup = await genreRepo.findOne({ name: trimmed, genreId: { [Op.ne]: id } }, { model });
      if (dup) throw new AppError("Tên thể loại đã tồn tại", 400, "GENRE_EXISTS");

      await genreRepo.updateById(id, { name: trimmed }, { model });
      return await genreRepo.findByPk(id, { model });
    },
  };
};
