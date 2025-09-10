const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const comicRoutes = require('./routes/comicRoute');
const commentRoutes = require('./routes/commentRoute');
const ratingRoutes = require('./routes/ratingRoute');
const cors = require('cors');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comics', comicRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy endpoint' });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Lỗi server' });
});
// Sync DB và khởi động server
sequelize.sync().then(() => {
  console.log('Database synced');
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});