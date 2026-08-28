const rateLimit = require("express-rate-limit");

// Chong tan cong brute-force vao dang nhap/dang ky: toi da 10 lan thu / 15 phut / IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Bạn thử quá nhiều lần. Vui lòng thử lại sau ít phút." },
});

// Gioi han chung cho toan bo API de chong lam dung/DoS co ban
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
