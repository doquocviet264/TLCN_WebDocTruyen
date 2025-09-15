const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const { Op } = require('sequelize');
const crypto = require('crypto');
const otpGenerator = require('otp-generator');
const { sendOTPEmail, sendResetPasswordEmail } = require('../services/emailService');
const { storeOTP, getOTP, removeOTP } = require('../utils/otpStorage');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Mật khẩu không khớp' });
  }

  try {
    let userByEmail = await User.findOne({ where: { email } });
    if (userByEmail) {
      return res.status(400).json({ msg: 'Email đã tồn tại' });
    }

    let userByUsername = await User.findOne({ where: { username } });
    if (userByUsername) {
      return res.status(400).json({ msg: 'Tên người dùng đã tồn tại' });
    }

    user = await User.create({ username, email, password });
    setTimeout(async () => {
      const checkUser = await User.findOne({ where: { userId: user.userId } });
      if (checkUser && !checkUser.isVerified) {
        await User.destroy({ where: { userId: user.userId } });
        console.log(`Người dùng ${user.email} bị xóa do không xác thực OTP`);
      }
    }, 5 * 60 * 1000);

    // Tạo OTP và gửi email
    const otp = otpGenerator.generate(6, {
      digits: true,                 
      lowerCaseAlphabets: false,    
      upperCaseAlphabets: false,    
      specialChars: false           
    });
    storeOTP(email, otp);
    console.log(otp)
    await sendOTPEmail(email, otp);

    res.status(201).json({ msg: 'Đăng ký thành công. Vui lòng xác thực OTP trong vòng 5 phút.' });
  } catch (err) {
    console.error('Lỗi khi đăng ký:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Không tìm thấy người dùng' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Tài khoản đã được xác thực' });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,                 
      lowerCaseAlphabets: false,    
      upperCaseAlphabets: false,    
      specialChars: false           
    });
    console.log(otp)
    storeOTP(email, otp);
    await sendOTPEmail(email, otp);

    res.json({ msg: 'OTP mới đã được gửi đến email của bạn' });
  } catch (err) {
    console.error('Lỗi khi gửi lại OTP:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const storedOTP = getOTP(email);

  if (!storedOTP || storedOTP !== otp) {
    return res.status(400).json({ msg: 'OTP không hợp lệ hoặc đã hết hạn' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Không tìm thấy người dùng' });
    }

    user.isVerified = true;
    await user.save();
    removeOTP(email);

    res.json({ msg: 'Xác thực tài khoản thành công' });
  } catch (err) {
    console.error('Lỗi khi xác nhận OTP:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Thông tin đăng nhập không hợp lệ' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Tài khoản chưa được xác thực' });
    }

    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Thông tin đăng nhập không hợp lệ' });
    }

    const payload = { user: { userId: user.userId } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.json({ token });
  } catch (err) {
    console.error('Lỗi khi đăng nhập:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Không tìm thấy người dùng' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetExpiration = Date.now() + 5 * 60 * 1000;
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    await sendResetPasswordEmail(email, resetUrl);

    res.json({ msg: 'Liên kết đặt lại mật khẩu đã được gửi đến email' });
  } catch (err) {
    console.error('[QUÊN MẬT KHẨU] Lỗi:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetExpiration: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetExpiration = null;
    await user.save();

    res.json({ msg: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('Lỗi khi đặt lại mật khẩu:', err);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

module.exports = { register, verifyOTP, login, forgotPassword, resetPassword, resendOTP };
