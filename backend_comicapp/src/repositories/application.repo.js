// app/repositories/application.repo.js
module.exports = {
  createApplication(data, { model, transaction } = {}) {
    return model.Application.create(data, { transaction });
  },

  findApplicationById(applicationId, { model } = {}) {
    return model.Application.findByPk(applicationId, {
      include: [
        { model: model.User, as: 'applicant', attributes: ['userId', 'username', 'email', 'avatar'] },
        { model: model.User, as: 'reviewer', attributes: ['userId', 'username', 'email'] },
        { model: model.TranslationGroup, as: 'targetGroup', attributes: ['groupId', 'name', 'avatarUrl'] },
      ],
    });
  },

  findApplicationsByUserId(userId, { model } = {}) {
    return model.Application.findAll({
      where: { userId },
      include: [
        { model: model.User, as: 'applicant', attributes: ['userId', 'username', 'email', 'avatar'] },
        { model: model.TranslationGroup, as: 'targetGroup', attributes: ['groupId', 'name', 'avatarUrl'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  },

  findTranslatorApplications({ status, page = 1, limit = 10 }, { model } = {}) {
    const where = { type: 'become_translator' };
    if (status) {
      where.status = status;
    }
    return model.Application.findAndCountAll({
      where,
      include: [
        { model: model.User, as: 'applicant', attributes: ['userId', 'username', 'email', 'avatar', 'role'] },
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });
  },

  findGroupJoinApplications({ groupId, status, page = 1, limit = 10 }, { model } = {}) {
    const where = { type: 'join_group', targetId: groupId };
    if (status) {
      where.status = status;
    }
    return model.Application.findAndCountAll({
      where,
      include: [
        { model: model.User, as: 'applicant', attributes: ['userId', 'username', 'email', 'avatar'] },
      ],
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });
  },

  async updateApplicationStatus(applicationId, status, reviewedBy, { model, transaction } = {}) {
    const updateData = { status };
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }
    const [updatedRows] = await model.Application.update(updateData, {
      where: { applicationId },
      transaction,
    });
    return updatedRows > 0;
  },

  async hasPendingApplication({ userId, type, targetId }, { model } = {}) {
    const where = { userId, type, status: 'pending' };
    if (targetId) {
      where.targetId = targetId;
    }
    const count = await model.Application.count({ where });
    return count > 0;
  }
};