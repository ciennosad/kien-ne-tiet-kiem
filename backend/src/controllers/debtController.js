const pool = require("../config/db");
const { encrypt, decrypt } = require("../utils/crypto");
const { logAction } = require("../utils/audit");

// Lay danh sach khoan no cua nguoi dung, kem so du con lai (goc - tong da tra)
async function list(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT d.id, d.type, d.counterparty, d.principal_amount, d.interest_rate, d.due_date,
              d.note_encrypted, d.is_closed, d.created_at,
              COALESCE(SUM(r.amount), 0) AS paid
       FROM debts d
       LEFT JOIN debt_repayments r ON r.debt_id = d.id
       WHERE d.user_id = $1
       GROUP BY d.id
       ORDER BY d.is_closed ASC, d.due_date ASC NULLS LAST, d.created_at DESC`,
      [req.user.id]
    );
    res.json(
      result.rows.map((r) => {
        const paid = Number(r.paid);
        const principal = Number(r.principal_amount);
        return {
          id: r.id,
          type: r.type,
          counterparty: r.counterparty,
          principal,
          interestRate: Number(r.interest_rate),
          dueDate: r.due_date ? r.due_date.toISOString().slice(0, 10) : null,
          note: r.note_encrypted ? decrypt(r.note_encrypted) : "",
          isClosed: r.is_closed,
          paid,
          remaining: Math.max(0, principal - paid),
          createdAt: r.created_at,
        };
      })
    );
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { type, counterparty, principal, interestRate, dueDate, note } = req.body;
    const noteEncrypted = note ? encrypt(note) : null;

    const result = await pool.query(
      `INSERT INTO debts (user_id, type, counterparty, principal_amount, interest_rate, due_date, note_encrypted)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, type, counterparty, principal_amount, interest_rate, due_date, note_encrypted, is_closed, created_at`,
      [req.user.id, type, counterparty, principal, interestRate || 0, dueDate || null, noteEncrypted]
    );
    await logAction(req.user.id, "DEBT_CREATE", `${type} - ${counterparty} - ${principal}`, req.ip);

    const r = result.rows[0];
    res.status(201).json({
      id: r.id,
      type: r.type,
      counterparty: r.counterparty,
      principal: Number(r.principal_amount),
      interestRate: Number(r.interest_rate),
      dueDate: r.due_date ? r.due_date.toISOString().slice(0, 10) : null,
      note: note || "",
      isClosed: r.is_closed,
      paid: 0,
      remaining: Number(r.principal_amount),
      createdAt: r.created_at,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy khoản nợ." });
    await logAction(req.user.id, "DEBT_DELETE", `id=${id}`, req.ip);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function listRepayments(req, res, next) {
  try {
    const { id } = req.params;
    const owner = await pool.query("SELECT id FROM debts WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (owner.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy khoản nợ." });

    const result = await pool.query(
      "SELECT id, amount, note_encrypted, tx_date FROM debt_repayments WHERE debt_id = $1 ORDER BY tx_date DESC, id DESC",
      [id]
    );
    res.json(
      result.rows.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        note: r.note_encrypted ? decrypt(r.note_encrypted) : "",
        date: r.tx_date.toISOString().slice(0, 10),
      }))
    );
  } catch (err) {
    next(err);
  }
}

// Ghi nhan 1 lan tra/thu no. Neu tra du so goc con lai, tu dong danh dau khoan no la da dong.
async function addRepayment(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const debtRes = await client.query("SELECT * FROM debts WHERE id = $1 AND user_id = $2 FOR UPDATE", [req.params.id, req.user.id]);
    if (debtRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy khoản nợ." });
    }
    const debt = debtRes.rows[0];
    if (debt.is_closed) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Khoản nợ này đã được tất toán." });
    }

    const { amount, note, date } = req.body;
    const paidRes = await client.query("SELECT COALESCE(SUM(amount), 0) AS paid FROM debt_repayments WHERE debt_id = $1", [debt.id]);
    const currentPaid = Number(paidRes.rows[0].paid);
    const remaining = Number(debt.principal_amount) - currentPaid;

    if (Number(amount) > remaining + 0.01) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `Số tiền vượt quá số nợ còn lại (${remaining.toLocaleString("vi-VN")}đ).` });
    }

    const noteEncrypted = note ? encrypt(note) : null;
    const insertRes = await client.query(
      `INSERT INTO debt_repayments (debt_id, user_id, amount, note_encrypted, tx_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, amount, note_encrypted, tx_date`,
      [debt.id, req.user.id, amount, noteEncrypted, date]
    );

    const newPaid = currentPaid + Number(amount);
    const shouldClose = newPaid >= Number(debt.principal_amount) - 0.01;
    if (shouldClose) {
      await client.query("UPDATE debts SET is_closed = true WHERE id = $1", [debt.id]);
    }

    await client.query("COMMIT");
    await logAction(req.user.id, "DEBT_REPAYMENT", `debt=${debt.id} amount=${amount}`, req.ip);

    const r = insertRes.rows[0];
    res.status(201).json({
      id: r.id,
      amount: Number(r.amount),
      note: note || "",
      date: r.tx_date.toISOString().slice(0, 10),
      debtClosed: shouldClose,
      remaining: Math.max(0, Number(debt.principal_amount) - newPaid),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { list, create, remove, listRepayments, addRepayment };
