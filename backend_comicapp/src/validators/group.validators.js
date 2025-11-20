// app/validators/group.validators.js
const { body, param } = require("express-validator");

const groupIdParam = [param("groupId").isInt({ min: 1 })];
const memberUserIdParam = [param("userId").isInt({ min: 1 })];

const createGroupBody = [
  body("name").isString().notEmpty().withMessage("Tên nhóm là bắt buộc"),
  body("description").optional().isString(),
  body("avatarUrl").optional().isString(),
];

const updateGroupBody = [
  body("name").optional().isString(),
  body("description").optional().isString(),
  body("avatarUrl").optional().isString(),
];
const dashboardGroupBody = [
  param("groupId").isInt({ min: 1 }),
  body("range").optional().isString(),
];

const addMemberBody = [
  body("userId").isInt({ min: 1 }).withMessage("userId không hợp lệ"),
];

const setLeaderBody = [
  body("newLeaderId")
    .isInt({ min: 1 })
    .withMessage("newLeaderId không hợp lệ"),
];

module.exports = {
  groupIdParam,
  memberUserIdParam,
  createGroupBody,
  updateGroupBody,
  addMemberBody,
  dashboardGroupBody,
  setLeaderBody,
};
