const User = require('./models/user'); // import model User
const sequelize = require('./config/database'); // import sequelize instance

(async () => {
  try {
    await sequelize.authenticate(); // kiểm tra kết nối
    console.log("✅ Database connected successfully");

    // Xóa toàn bộ dữ liệu trong bảng Users (reset cả AUTO_INCREMENT)
    await User.destroy({
      where: {},
      truncate: true
    });

    console.log("✅ All data in Users table deleted successfully");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
