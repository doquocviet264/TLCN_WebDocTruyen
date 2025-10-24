// app/repositories/report.repo.js
module.exports = {
  destroy(where, { model, transaction } = {}) {
    return model.Report.destroy({ where, transaction });
  },
  countByComment(commentId, { model } = {}) {
    return model.Report.count({ where: { targetId: commentId, type: "comment" } });
  },
  findByPk(id, { model, include, transaction } = {}) {
    return model.Report.findByPk(id, { include, transaction });
  },

  findAll({ where = {}, limit, offset, order = [["createdAt", "DESC"]], include = [] }, { model } = {}) {
    return model.Report.findAll({ where, limit, offset, order, include });
  },

  findAndCountAll({ where = {}, limit, offset, order = [["createdAt", "DESC"]], include = [] }, { model } = {}) {
    return model.Report.findAndCountAll({ where, limit, offset, order, include, distinct: true });
  },

  create(data, { model, transaction } = {}) {
    return model.Report.create(data, { transaction });
  },

  updateById(id, data, { model, transaction } = {}) {
    return model.Report.update(data, { where: { reportId: id }, transaction });
  },

  destroyById(id, { model, transaction } = {}) {
    return model.Report.destroy({ where: { reportId: id }, transaction });
  },
};
