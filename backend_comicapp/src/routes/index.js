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

module.exports = router;
