const express = require("express");
const { body, validationResult } = require("express-validator");
const budgetController = require("../controllers/budgetController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

router.use(authenticate);

router.get("/", budgetController.list);
router.post(
  "/",
  [
    body("categoryId").isInt().withMessage("categoryId khong hop le."),
    body("month").matches(/^\d{4}-\d{2}$/).withMessage("month phải có định dạng YYYY-MM."),
    body("limit").isFloat({ gt: 0 }).withMessage("Hạn mức phải lớn hơn 0."),
  ],
  validate,
  budgetController.upsert
);

module.exports = router;
