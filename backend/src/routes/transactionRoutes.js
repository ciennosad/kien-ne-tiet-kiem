const express = require("express");
const { body, validationResult } = require("express-validator");
const transactionController = require("../controllers/transactionController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

const txRules = [
  body("type").isIn(["income", "expense"]).withMessage("Loại giao dịch không hợp lệ."),
  body("amount").isFloat({ gt: 0 }).withMessage("Số tiền phải lớn hơn 0."),
  body("date").isISO8601().withMessage("Ngày khong hop le."),
  body("note").optional({ nullable: true }).isLength({ max: 500 }).withMessage("Ghi chú qua dai."),
];

router.use(authenticate);

router.get("/", transactionController.list);
router.get("/summary", transactionController.summary);
router.post("/", txRules, validate, transactionController.create);
router.put("/:id", txRules, validate, transactionController.update);
router.delete("/:id", transactionController.remove);

module.exports = router;
