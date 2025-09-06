// Lưu trữ tạm OTP (sử dụng Map, hết hạn sau 5 phút). Có thể thay bằng Redis cho production.
const otps = new Map();

const storeOTP = (email, otp) => {
  otps.set(email, otp);
  setTimeout(() => otps.delete(email), 300000); // 5 phút
};

const getOTP = (email) => otps.get(email);

const removeOTP = (email) => otps.delete(email);

module.exports = { storeOTP, getOTP, removeOTP };