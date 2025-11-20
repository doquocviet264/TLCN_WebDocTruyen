// app/controllers/group.controller.js
const ok = require("../utils/responses/ok");
const asyncHandler = require("../middlewares/asyncHandler");
const cloudinary = require("../config/cloudinary"); // Import cloudinary
const fs = require("fs"); // Import fs for file system operations

module.exports = (groupService) => ({
  // POST /api/groups
  createGroup: asyncHandler(async (req, res) => {
    const ownerId = req.user.userId;
    const { name, description, avatarUrl } = req.body;

    const group = await groupService.createGroup({
      ownerId,
      name,
      description,
      avatarUrl,
    });

    return ok(res, { data: group });
  }),

  // GET /api/groups
  listGroups: asyncHandler(async (req, res) => {
    const { q, page, limit } = req.query;

    const result = await groupService.listGroups({ q, page, limit });

    return ok(res, {
      data: result.items,
      meta: result.pagination,
    });
  }),

  // GET /api/groups/:groupId
  getGroupDetails: asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const group = await groupService.getGroupDetails({ groupId: +groupId });
    return ok(res, { data: group });
  }),

  // PATCH /api/groups/:groupId
  updateGroup: asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;
    const { groupId } = req.params;
    let { name, description, avatarUrl } = req.body; // Allow avatarUrl to be mutable

    // Handle avatar upload if a file is provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "group_avatars", // Specify a folder for group avatars
      });
      avatarUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // Delete the temporary file
    } else if (req.body.avatarUrl === "") {
      // If avatarUrl is explicitly set to empty string, clear it
      avatarUrl = null;
    }

    const data = await groupService.updateGroup({
      groupId: +groupId,
      currentUserId,
      name,
      description,
      avatarUrl,
    });

    return ok(res, { data });
  }),

  // DELETE /api/groups/:groupId
  deleteGroup: asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;
    const { groupId } = req.params;

    const data = await groupService.deleteGroup({
      groupId: +groupId,
      currentUserId,
    });

    return ok(res, { data });
  }),

  // POST /api/groups/:groupId/members
  addMember: asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;
    const { groupId } = req.params;
    const { userId } = req.body;

    const data = await groupService.addMember({
      currentUserId,
      groupId: +groupId,
      userId: +userId,
    });

    return ok(res, { data });
  }),

  // DELETE /api/groups/:groupId/members/:userId
  removeMember: asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;
    const { groupId, userId } = req.params;

    const data = await groupService.removeMember({
      currentUserId,
      groupId: +groupId,
      userId: +userId,
    });

    return ok(res, { data });
  }),

  // POST /api/groups/:groupId/leave
  leaveGroup: asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;
    const { groupId } = req.params;

    const data = await groupService.leaveGroup({
      currentUserId,
      groupId: +groupId,
    });

    return ok(res, { data });
  }),

  // POST /api/groups/:groupId/leader
  setLeader: asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;
    const { groupId } = req.params;
    const { newLeaderId } = req.body;

    const data = await groupService.setLeader({
      currentUserId,
      groupId: +groupId,
      newLeaderId: +newLeaderId,
    });

    return ok(res, { data });
  }),

  // GET /api/groups/:groupId/dashboard
  getGroupDashboard: async (req, res, next) => {
    try {
      const { groupId } = req.params;
      const { range } = req.query; // vd: "7d" hoặc "30d"
      const data = await groupService.getGroupDashboard({
        groupId: Number(groupId),
        range: range || "30d",
      });
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/groups/:groupId/eligible-members?q=&page=&limit=
  searchEligibleMembers: asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { q, page, limit } = req.query;

    const result = await groupService.searchEligibleMembers({
      groupId: +groupId,
      q,
      page,
      limit,
    });

    return ok(res, {
      data: result.items,
      meta: result.pagination,
    });
  }),
});
