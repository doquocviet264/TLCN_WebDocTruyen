// utils/otpStorage.js
const otps = new Map();
function storeOTP(email, otp) {
  otps.set(email, otp);
  setTimeout(() => otps.delete(email), 300000); // 5 phút
}
const getOTP = (email) => otps.get(email);
const removeOTP = (email) => otps.delete(email);
module.exports = { storeOTP, getOTP, removeOTP };
