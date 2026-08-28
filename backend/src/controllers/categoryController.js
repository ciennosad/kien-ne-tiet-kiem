const pool = require("../config/db");
const { logAction } = require("../utils/audit");

async function list(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, name, type, color FROM categories WHERE user_id = $1 ORDER BY id",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, type, color } = req.body;
    const result = await pool.query(
      "INSERT INTO categories (user_id, name, type, color) VALUES ($1, $2, $3, $4) RETURNING id, name, type, color",
      [req.user.id, name, type, color || "#898781"]
    );
    await logAction(req.user.id, "CATEGORY_CREATE", name, req.ip);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy danh mục." });
    await logAction(req.user.id, "CATEGORY_DELETE", `id=${id}`, req.ip);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove };
