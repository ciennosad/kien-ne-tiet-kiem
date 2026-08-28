const express = require("express");
const { body, validationResult } = require("express-validator");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

router.use(authenticate);

router.get("/bank-account", userController.getBankAccount);
router.put(
  "/bank-account",
  [
    body("bankBin").trim().matches(/^\d{6}$/).withMessage("Mã ngân hàng (BIN) phải gồm 6 chữ số."),
    body("accountNumber").trim().isLength({ min: 4, max: 30 }).withMessage("Số tài khoản không hợp lệ."),
    body("accountName").trim().isLength({ min: 2, max: 150 }).withMessage("Tên chủ tài khoản không hợp lệ."),
  ],
  validate,
  userController.updateBankAccount
);

module.exports = router;
