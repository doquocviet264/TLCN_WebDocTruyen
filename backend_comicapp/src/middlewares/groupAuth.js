const { models } = require("../db");

const belongsToGroup = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const groupId = Number(req.params.groupId);

    // 1. check owner
    const group = await models.TranslationGroup.findByPk(groupId);
    if (!group) return res.status(404).json({ message: "Không tìm thấy nhóm" });

    // 2. check member
    const link = await models.TranslationGroupMember.findOne({
      where: { groupId, userId },
    });
    if (!link)
      return res.status(403).json({ message: "Bạn không phải thành viên của nhóm này" });

    // 3. Gắn role nhóm vào req
    req.groupRole = link.role; // "leader" | "member"
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
const isGroupLeader = (req, res, next) => {
  if (req.groupRole === "leader") return next();
  // nếu owner thì vẫn pass
  if (req.user.userId === req.group?.ownerId) return next();

  return res.status(403).json({ message: "Bạn không phải leader của nhóm" });
};
module.exports = { belongsToGroup, isGroupLeader };
