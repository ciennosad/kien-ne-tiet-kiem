const pool = require("../config/db");
const { encrypt, decrypt } = require("../utils/crypto");
const { logAction } = require("../utils/audit");

function toClient(row) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category_id,
    note: row.note_encrypted ? decrypt(row.note_encrypted) : "",
    date: row.tx_date.toISOString().slice(0, 10),
  };
}

// Lay danh sach giao dich cua nguoi dung, ho tro loc theo thang / danh muc va phan trang
async function list(req, res, next) {
  try {
    const { month, categoryId, page = 1, pageSize = 100 } = req.query;
    const conditions = ["user_id = $1"];
    const params = [req.user.id];

    if (month) {
      params.push(`${month}-01`);
      conditions.push(`date_trunc('month', tx_date) = date_trunc('month', $${params.length}::date)`);
    }
    if (categoryId) {
      params.push(categoryId);
      conditions.push(`category_id = $${params.length}`);
    }

    const limit = Math.min(Number(pageSize) || 100, 200);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT id, type, amount, category_id, note_encrypted, tx_date
       FROM transactions
       WHERE ${conditions.join(" AND ")}
       ORDER BY tx_date DESC, id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json(result.rows.map(toClient));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { type, amount, category, note, date } = req.body;
    const noteEncrypted = note ? encrypt(note) : null;

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, note_encrypted, tx_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, amount, category_id, note_encrypted, tx_date`,
      [req.user.id, category || null, type, amount, noteEncrypted, date]
    );

    await logAction(req.user.id, "TRANSACTION_CREATE", `so tien=${amount}`, req.ip);
    res.status(201).json(toClient(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { type, amount, category, note, date } = req.body;
    const noteEncrypted = note ? encrypt(note) : null;

    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, amount = $2, category_id = $3, note_encrypted = $4, tx_date = $5, updated_at = now()
       WHERE id = $6 AND user_id = $7
       RETURNING id, type, amount, category_id, note_encrypted, tx_date`,
      [type, amount, category || null, noteEncrypted, date, id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    await logAction(req.user.id, "TRANSACTION_UPDATE", `id=${id}`, req.ip);
    res.json(toClient(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy giao dịch." });
    await logAction(req.user.id, "TRANSACTION_DELETE", `id=${id}`, req.ip);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// Bao cao tong hop: tong thu/chi theo thang + phan bo theo danh muc, dung cho dashboard
async function summary(req, res, next) {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: "Thiếu tham số month (YYYY-MM)." });

    const totals = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND date_trunc('month', tx_date) = date_trunc('month', $2::date)
       GROUP BY type`,
      [req.user.id, `${month}-01`]
    );

    const byCategory = await pool.query(
      `SELECT c.id AS category_id, c.name, c.color, COALESCE(SUM(t.amount), 0) AS total
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id
         AND t.user_id = $1
         AND date_trunc('month', t.tx_date) = date_trunc('month', $2::date)
       WHERE c.user_id = $1 AND c.type = 'expense'
       GROUP BY c.id, c.name, c.color
       HAVING COALESCE(SUM(t.amount), 0) > 0
       ORDER BY total DESC`,
      [req.user.id, `${month}-01`]
    );

    const trend = await pool.query(
      `SELECT to_char(tx_date, 'YYYY-MM') AS month,
              SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
       FROM transactions
       WHERE user_id = $1
       GROUP BY month
       ORDER BY month DESC
       LIMIT 6`,
      [req.user.id]
    );

    res.json({
      income: Number(totals.rows.find((r) => r.type === "income")?.total || 0),
      expense: Number(totals.rows.find((r) => r.type === "expense")?.total || 0),
      byCategory: byCategory.rows.map((r) => ({ categoryId: r.category_id, name: r.name, color: r.color, value: Number(r.total) })),
      trend: trend.rows.reverse().map((r) => ({ month: r.month, income: Number(r.income), expense: Number(r.expense) })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, summary };
