const express = require("express");
const { body, validationResult } = require("express-validator");
const categoryController = require("../controllers/categoryController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

router.use(authenticate);

router.get("/", categoryController.list);

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Tên danh mục không hợp lệ."),
    body("type").isIn(["income", "expense"]).withMessage("Loại danh mục phải là income hoặc expense."),
  ],
  validate,
  categoryController.create
);

router.delete("/:id", categoryController.remove);

module.exports = router;
