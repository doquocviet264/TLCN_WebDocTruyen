const User = require('./models/user'); // import model User
const sequelize = require('./config/db'); // import sequelize instance

(async () => {
  try {
    await sequelize.authenticate(); // kiểm tra kết nối
    console.log("✅ Database connected successfully");

    await User.sync({ force: true }); // xóa và tạo lại bảng Users
    console.log("✅ Users table reset successfully");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
