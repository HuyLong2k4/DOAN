const bcrypt = require('bcryptjs');

// Sinh OTP 4 chữ số ngẫu nhiên
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Hash OTP trước khi lưu DB

const hashOtp = async (otp) => {
    return bcrypt.hash(otp, 10);
};

// So sánh OTP người dùng nhập với hash đã lưu
const compareOtp = async (otp, hash) => {
    return bcrypt.compare(otp, hash);
};

module.exports = { generateOtp, hashOtp, compareOtp };
