const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm tạo nội dung email cho OTP
const sendOTPEmail = async (to, otp) => {
  const subject = 'Xác Nhận Đăng Ký Tài Khoản';
  const html = `
    <p>Chào bạn,</p>

    <p>Cảm ơn bạn đã đăng ký tài khoản. Mã OTP của bạn là:</p>

    <h2>${otp}</h2>

    <p>Vui lòng nhập mã này để hoàn tất quá trình đăng ký.<br/>
    Mã OTP có hiệu lực trong 5 phút.</p>

    <p>Trân trọng,<br/>
    Đội ngũ Comic App</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

// Hàm tạo nội dung email cho reset mật khẩu
const sendResetPasswordEmail = async (to, resetUrl) => {
  const subject = 'Yêu Cầu Đặt Lại Mật Khẩu';
  const html = `
      <h2>Thay đổi mật khẩu</h2>
      <p>Xin chào</p>
      <p>Chúng tôi gửi cho bạn email này để xử lý yêu cầu đặt lại mật khẩu của bạn trên Comic Hay.</p>
      <p>Để đặt lại mật khẩu của bạn, vui lòng chọn liên kết dưới đây (liên kết có hiệu lực trong 10 phút):</p>
      <p></p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
      <p></p>
      <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
    `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendResetPasswordEmail };