// app/services/auth.service.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const otpGenerator = require("otp-generator");
const AppError = require("../utils/AppError");
const { storeOTP, getOTP, removeOTP } = require("../utils/otpStorage");
const { sendOTPEmail, sendResetPasswordEmail } = require("./email.service");

module.exports = ({ sequelize, model, userRepo }) => {
  return {

    async register({ username, email, password, confirmPassword }) {
      if (password !== confirmPassword) {
        throw new AppError("Mật khẩu không khớp", 400, "PASSWORD_MISMATCH");
      }

      return await sequelize.transaction(async (t) => {
        const byEmail = await userRepo.findOne({ email }, { model, transaction: t });
        if (byEmail) throw new AppError("Email đã tồn tại", 409, "EMAIL_TAKEN");

        const byUsername = await userRepo.findOne({ username }, { model, transaction: t });
        if (byUsername) throw new AppError("Tên người dùng đã tồn tại", 409, "USERNAME_TAKEN");

        const user = await userRepo.create({ username, email, password }, { model, transaction: t });

        // Xoá nếu không xác thực OTP trong 5 phút 
        setTimeout(async () => {
          try {
            const chk = await userRepo.findById(user.userId, { model });
            if (chk && !chk.isVerified) {
              await model.User.destroy({ where: { userId: user.userId } });
              console.log(`User ${user.email} deleted due to OTP timeout`);
            }
          } catch (e) { /* ignore */ }
        }, 5 * 60 * 1000);

        // Tạo & gửi OTP
        const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
        storeOTP(email, otp);
        await sendOTPEmail(email, otp);

        return { message: "Đăng ký thành công. Vui lòng xác thực OTP trong 5 phút." };
      });
    },

    async resendOTP({ email }) {
      const user = await userRepo.findOne({ email }, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 400, "USER_NOT_FOUND");
      if (user.isVerified) throw new AppError("Tài khoản đã được xác thực", 400, "ALREADY_VERIFIED");

      const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
      storeOTP(email, otp);
      await sendOTPEmail(email, otp);
      return { message: "OTP mới đã được gửi đến email của bạn" };
    },

    async verifyOTP({ email, otp }) {
      const stored = getOTP(email);
      if (!stored || stored !== otp) throw new AppError("OTP không hợp lệ hoặc đã hết hạn", 400, "OTP_INVALID");

      const user = await userRepo.findOne({ email }, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 400, "USER_NOT_FOUND");

      user.isVerified = true;
      await user.save();
      removeOTP(email);
      return { message: "Xác thực tài khoản thành công" };
    },

    async login({ email, password }) {
      const user = await userRepo.findOne({ email }, { model });
      if (!user) throw new AppError("Thông tin đăng nhập không hợp lệ", 400, "LOGIN_INVALID");
      if (!user.isVerified) throw new AppError("Tài khoản chưa được xác thực", 400, "NOT_VERIFIED");
      if (user.status==="suspended") throw new AppError("Tài khoản đã bị khoá", 400, "NOT_VERIFIED");
      const ok = await user.validPassword(password);
      if (!ok) throw new AppError("Thông tin đăng nhập không hợp lệ", 400, "LOGIN_INVALID");

      await user.update({ lastLogin: new Date() });
      const payload = { user: { userId: user.userId, role: user.role } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
      return { token, role: user.role };
    },

    async forgotPassword({ email }) {
      const user = await userRepo.findOne({ email }, { model });
      if (!user) throw new AppError("Không tìm thấy người dùng", 400, "USER_NOT_FOUND");

      const resetToken = crypto.randomBytes(20).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      user.resetToken = hashedToken;
      // 10 phút
      user.resetExpiration = Date.now() + 10 * 60 * 1000;
      await user.save();

      const base = process.env.FRONTEND_URL || "http://localhost:5173";
      const resetUrl = `${base}/reset-password/${resetToken}`;
      await sendResetPasswordEmail(email, resetUrl);

      return { message: "Liên kết đặt lại mật khẩu đã được gửi đến email" };
    },

    async resetPassword({ token, newPassword }) {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const user = await model.User.findOne({
        where: { resetToken: hashedToken, resetExpiration: { [model.Sequelize.Op.gt]: Date.now() } },
      });
      if (!user) throw new AppError("Token không hợp lệ hoặc đã hết hạn", 400, "TOKEN_INVALID");

      user.password = newPassword;
      user.resetToken = null;
      user.resetExpiration = null;
      await user.save();

      return { message: "Đặt lại mật khẩu thành công" };
    },

  };
};
