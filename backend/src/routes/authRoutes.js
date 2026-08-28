const express = require("express");
const { body, validationResult } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Tên phải từ 2-100 ký tự."),
    body("email").trim().isEmail().withMessage("Email không hợp lệ.").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Mật khẩu phải có ít nhất 8 ký tự.")
      .matches(/[A-Z]/)
      .withMessage("Mật khẩu cần ít nhất 1 chữ hoa.")
      .matches(/[0-9]/)
      .withMessage("Mật khẩu cần ít nhất 1 chữ số."),
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").trim().isEmail().withMessage("Email không hợp lệ.").normalizeEmail(),
    body("password").notEmpty().withMessage("Vui lòng nhập mật khẩu."),
  ],
  validate,
  authController.login
);

router.post("/refresh", authController.refresh);
router.get("/me", authenticate, authController.me);

module.exports = router;
