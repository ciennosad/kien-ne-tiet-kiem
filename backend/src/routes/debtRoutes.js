const express = require("express");
const { body, validationResult } = require("express-validator");
const debtController = require("../controllers/debtController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

router.use(authenticate);

router.get("/", debtController.list);
router.post(
  "/",
  [
    body("type").isIn(["borrow", "lend"]).withMessage("Loại khoản nợ không hợp lệ."),
    body("counterparty").trim().isLength({ min: 1, max: 150 }).withMessage("Nhập tên người vay/cho vay."),
    body("principal").isFloat({ gt: 0 }).withMessage("Số tiền gốc phải lớn hơn 0."),
    body("interestRate").optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage("Lãi suất không hợp lệ."),
    body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Hạn trả không hợp lệ."),
  ],
  validate,
  debtController.create
);
router.delete("/:id", debtController.remove);

router.get("/:id/repayments", debtController.listRepayments);
router.post(
  "/:id/repayments",
  [
    body("amount").isFloat({ gt: 0 }).withMessage("Số tiền phải lớn hơn 0."),
    body("date").isISO8601().withMessage("Ngày không hợp lệ."),
    body("note").optional({ nullable: true }).isLength({ max: 300 }).withMessage("Ghi chú quá dài."),
  ],
  validate,
  debtController.addRepayment
);

module.exports = router;
