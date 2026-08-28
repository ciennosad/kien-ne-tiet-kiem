const express = require("express");
const { body, validationResult } = require("express-validator");
const savingsController = require("../controllers/savingsController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

const amountRules = [
  body("amount").isFloat({ gt: 0 }).withMessage("Số tiền phải lớn hơn 0."),
  body("date").isISO8601().withMessage("Ngày khong hop le."),
  body("note").optional({ nullable: true }).isLength({ max: 300 }).withMessage("Ghi chú qua dai."),
];

router.use(authenticate);

router.get("/", savingsController.list);
router.post(
  "/",
  [
    body("name").trim().isLength({ min: 1, max: 150 }).withMessage("Tên sổ tiết kiệm không hợp lệ."),
    body("goalAmount").optional({ nullable: true }).isFloat({ gt: 0 }).withMessage("Mục tiêu phải lớn hơn 0."),
    body("interestRate").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("Lãi suất không hợp lệ."),
  ],
  validate,
  savingsController.create
);
router.delete("/:id", savingsController.remove);

router.get("/:id/transactions", savingsController.listTransactions);
router.post("/:id/deposit", amountRules, validate, savingsController.deposit);
router.post("/:id/withdraw", amountRules, validate, savingsController.withdraw);

// Nạp tiền qua QR chuyen khoan ngan hang (VietQR)
router.post(
  "/:id/qr-deposit/initiate",
  [body("amount").isFloat({ gt: 0 }).withMessage("Số tiền phải lớn hơn 0.")],
  validate,
  savingsController.initiateQrDeposit
);
router.get("/qr-deposit/:refCode/status", savingsController.getQrDepositStatus);
router.post("/qr-deposit/:refCode/confirm", savingsController.confirmQrDeposit);
router.post("/qr-deposit/:refCode/cancel", savingsController.cancelQrDeposit);

module.exports = router;
