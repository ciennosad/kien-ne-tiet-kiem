const pool = require("../config/db");
const { logAction } = require("../utils/audit");

async function list(req, res, next) {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: "Thiếu tham số month (YYYY-MM)." });

    const result = await pool.query(
      "SELECT id, category_id, month, limit_amount FROM budgets WHERE user_id = $1 AND month = $2",
      [req.user.id, month]
    );
    res.json(result.rows.map((r) => ({ id: r.id, categoryId: r.category_id, month: r.month, limit: Number(r.limit_amount) })));
  } catch (err) {
    next(err);
  }
}

// Tao moi hoac cap nhat han muc cho 1 danh muc trong 1 thang (upsert)
async function upsert(req, res, next) {
  try {
    const { categoryId, month, limit } = req.body;
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, month, limit_amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category_id, month)
       DO UPDATE SET limit_amount = EXCLUDED.limit_amount
       RETURNING id, category_id, month, limit_amount`,
      [req.user.id, categoryId, month, limit]
    );
    await logAction(req.user.id, "BUDGET_SET", `category=${categoryId} month=${month} limit=${limit}`, req.ip);
    const r = result.rows[0];
    res.json({ id: r.id, categoryId: r.category_id, month: r.month, limit: Number(r.limit_amount) });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, upsert };
