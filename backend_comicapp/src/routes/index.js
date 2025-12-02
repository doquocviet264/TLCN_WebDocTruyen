// app/routes/index.js  
const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/chapters", require("./chapter.routes"));
router.use("/comics", require("./comic.routes"));
router.use("/comments", require("./comment.routes"));
router.use("/genres", require("./genre.routes"));
router.use("/history", require("./history.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/quests", require("./quest.routes"));
router.use("/ratings", require("./rating.routes"));
router.use("/reports", require("./report.routes"));
router.use("/user", require("./user.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/community", require("./community.routes"));
router.use("/chat", require("./chat.routes"));
router.use("/groups", require("./group.routes"));
router.use("/applications", require("./application.routes"));
router.use("/translator", require("./translator.routes"));
router.use("/reviews", require("./review.routes"));
module.exports = router;
