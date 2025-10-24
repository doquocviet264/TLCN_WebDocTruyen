// app/validators/chapter.validators.js
const { param } = require("express-validator");

const unlockParam = [ param("chapterId").isInt({ min: 1 }) ];
const checkUnlockParam = [ param("chapterId").isInt({ min: 1 }) ];

const chapterDetailsParam = [
  param("slug").isString().notEmpty(),
  param("chapterNumber").custom((v) => !isNaN(parseFloat(v))),
];

module.exports = {
  unlockParam,
  checkUnlockParam,
  chapterDetailsParam,
};
