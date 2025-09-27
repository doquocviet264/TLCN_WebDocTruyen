const express = require('express');
const router = express.Router();
const { getAllGenres } = require('../controllers/genreController.js');

// API lấy danh sách genre
router.get('/', getAllGenres);

module.exports = router;
