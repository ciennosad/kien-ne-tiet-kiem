const crypto = require("crypto");
const pool = require("../config/db");
const { encrypt, decrypt } = require("../utils/crypto");
const { logAction } = require("../utils/audit");

// Lay danh sach so tiet kiem cua nguoi dung, kem so du hien tai (tinh tu tong nap - tong rut)
async function list(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT sa.id, sa.name, sa.goal_amount, sa.interest_rate, sa.color, sa.is_closed, sa.created_at,
              COALESCE(SUM(CASE WHEN st.type = 'deposit' THEN st.amount ELSE -st.amount END), 0) AS balance
       FROM savings_accounts sa
       LEFT JOIN savings_transactions st ON st.savings_account_id = sa.id
       WHERE sa.user_id = $1
       GROUP BY sa.id
       ORDER BY sa.created_at DESC`,
      [req.user.id]
    );
    res.json(
      result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        goalAmount: r.goal_amount ? Number(r.goal_amount) : null,
        interestRate: Number(r.interest_rate),
        color: r.color,
        isClosed: r.is_closed,
        balance: Number(r.balance),
        createdAt: r.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, goalAmount, interestRate, color } = req.body;
    const result = await pool.query(
      `INSERT INTO savings_accounts (user_id, name, goal_amount, interest_rate, color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, goal_amount, interest_rate, color, is_closed, created_at`,
      [req.user.id, name, goalAmount || null, interestRate || 0, color || "#4f46e5"]
    );
    await logAction(req.user.id, "SAVINGS_CREATE", name, req.ip);
    const r = result.rows[0];
    res.status(201).json({
      id: r.id,
      name: r.name,
      goalAmount: r.goal_amount ? Number(r.goal_amount) : null,
      interestRate: Number(r.interest_rate),
      color: r.color,
      isClosed: r.is_closed,
      balance: 0,
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
      "DELETE FROM savings_accounts WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy sổ tiết kiệm." });
    await logAction(req.user.id, "SAVINGS_DELETE", `id=${id}`, req.ip);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// Lich su nap/rut cua 1 so tiet kiem cu the
async function listTransactions(req, res, next) {
  try {
    const { id } = req.params;
    const owner = await pool.query("SELECT id FROM savings_accounts WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (owner.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy sổ tiết kiệm." });

    const result = await pool.query(
      `SELECT id, type, amount, note_encrypted, tx_date
       FROM savings_transactions WHERE savings_account_id = $1
       ORDER BY tx_date DESC, id DESC`,
      [id]
    );
    res.json(
      result.rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: Number(r.amount),
        note: r.note_encrypted ? decrypt(r.note_encrypted) : "",
        date: r.tx_date.toISOString().slice(0, 10),
      }))
    );
  } catch (err) {
    next(err);
  }
}

// Nạp tiền vào so tiet kiem. Neu muon "nạp từ ví chi tiêu", frontend co the goi them
// API tao 1 giao dich "expense" tuong ung ben transactions de tru vao ngan sach thang.
async function deposit(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, note, date } = req.body;

    const owner = await pool.query("SELECT id, is_closed FROM savings_accounts WHERE id = $1 AND user_id = $2", [id, req.user.id]);
    if (owner.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy sổ tiết kiệm." });
    if (owner.rows[0].is_closed) return res.status(400).json({ message: "Sổ tiết kiệm này đã đóng." });

    const noteEncrypted = note ? encrypt(note) : null;
    const result = await pool.query(
      `INSERT INTO savings_transactions (savings_account_id, user_id, type, amount, note_encrypted, tx_date)
       VALUES ($1, $2, 'deposit', $3, $4, $5)
       RETURNING id, type, amount, note_encrypted, tx_date`,
      [id, req.user.id, amount, noteEncrypted, date]
    );
    await logAction(req.user.id, "SAVINGS_DEPOSIT", `savings=${id} amount=${amount}`, req.ip);
    const r = result.rows[0];
    res.status(201).json({ id: r.id, type: r.type, amount: Number(r.amount), note: note || "", date: r.tx_date.toISOString().slice(0, 10) });
  } catch (err) {
    next(err);
  }
}

async function withdraw(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, note, date } = req.body;

    const balanceRes = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END), 0) AS balance
       FROM savings_transactions WHERE savings_account_id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    const currentBalance = Number(balanceRes.rows[0].balance);
    if (Number(amount) > currentBalance) {
      return res.status(400).json({ message: "Số dư không đủ để rút số tiền này." });
    }

    const noteEncrypted = note ? encrypt(note) : null;
    const result = await pool.query(
      `INSERT INTO savings_transactions (savings_account_id, user_id, type, amount, note_encrypted, tx_date)
       VALUES ($1, $2, 'withdraw', $3, $4, $5)
       RETURNING id, type, amount, note_encrypted, tx_date`,
      [id, req.user.id, amount, noteEncrypted, date]
    );
    await logAction(req.user.id, "SAVINGS_WITHDRAW", `savings=${id} amount=${amount}`, req.ip);
    const r = result.rows[0];
    res.status(201).json({ id: r.id, type: r.type, amount: Number(r.amount), note: note || "", date: r.tx_date.toISOString().slice(0, 10) });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, remove, listTransactions, deposit, withdraw, initiateQrDeposit, getQrDepositStatus, confirmQrDeposit, cancelQrDeposit };

// ---------------------------------------------------------------------------
// Nạp tiền qua QR chuyen khoan ngan hang (chuan VietQR)
// ---------------------------------------------------------------------------

// Sinh ma tham chieu giao dich duy nhat, dung lam noi dung chuyen khoan de doi chieu.
function generateRefCode(savingsAccountId) {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TK${savingsAccountId}${rand}`;
}

// Buoc 1: nguoi dung bam "Nạp qua QR" -> tao 1 yeu cau "pending" va sinh URL anh QR
// VietQR (dich vu cong khai cua Napas/VietQR, khong can API key cho anh QR co ban).
async function initiateQrDeposit(req, res, next) {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const savingsAcc = await pool.query(
      "SELECT id, name, is_closed FROM savings_accounts WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (savingsAcc.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy sổ tiết kiệm." });
    if (savingsAcc.rows[0].is_closed) return res.status(400).json({ message: "Sổ tiết kiệm này đã đóng." });

    const userRes = await pool.query(
      "SELECT bank_bin, bank_account_number, bank_account_name FROM users WHERE id = $1",
      [req.user.id]
    );
    const bank = userRes.rows[0];
    if (!bank.bank_bin || !bank.bank_account_number) {
      return res.status(400).json({ message: "Bạn chưa liên kết tài khoản ngân hàng. Vào Cài đặt để thêm trước." });
    }

    const refCode = generateRefCode(id);
    const insertRes = await pool.query(
      `INSERT INTO transfer_requests (user_id, savings_account_id, ref_code, amount)
       VALUES ($1, $2, $3, $4) RETURNING id, ref_code, amount, status, created_at`,
      [req.user.id, id, refCode, amount]
    );

    const addInfo = encodeURIComponent(refCode);
    const accountName = encodeURIComponent(bank.bank_account_name || "");
    const qrUrl = `https://img.vietqr.io/image/${bank.bank_bin}-${bank.bank_account_number}-compact2.png?amount=${Math.round(amount)}&addInfo=${addInfo}&accountName=${accountName}`;

    await logAction(req.user.id, "QR_DEPOSIT_INITIATE", `savings=${id} amount=${amount} ref=${refCode}`, req.ip);

    res.status(201).json({
      refCode,
      amount: Number(amount),
      qrUrl,
      bank: { bin: bank.bank_bin, accountNumber: bank.bank_account_number, accountName: bank.bank_account_name },
      status: insertRes.rows[0].status,
      requestId: insertRes.rows[0].id,
    });
  } catch (err) {
    next(err);
  }
}

// Kiem tra trang thai (pending / confirmed / cancelled) - frontend poll dinh ky
async function getQrDepositStatus(req, res, next) {
  try {
    const { refCode } = req.params;
    const result = await pool.query(
      "SELECT ref_code, amount, status, savings_account_id FROM transfer_requests WHERE ref_code = $1 AND user_id = $2",
      [refCode, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy yêu cầu chuyển khoản." });
    const r = result.rows[0];
    res.json({ refCode: r.ref_code, amount: Number(r.amount), status: r.status });
  } catch (err) {
    next(err);
  }
}

// Buoc 2: nguoi dung bam "Tôi đã chuyển khoản xong" sau khi quet QR va chuyen tien that
// tren app ngan hang. Vi day la do an demo khong co webhook ngan hang that, buoc xac
// nhan nay do nguoi dung thao tac; khi tich hop that, thay the buoc nay bang webhook
// tu dich vu doi soat giao dich (vi du Casso.vn, SePay) doi chieu dung noi dung refCode.
async function confirmQrDeposit(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reqRow = await client.query(
      "SELECT * FROM transfer_requests WHERE ref_code = $1 AND user_id = $2 FOR UPDATE",
      [req.params.refCode, req.user.id]
    );
    if (reqRow.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Không tìm thấy yêu cầu chuyển khoản." });
    }
    const transfer = reqRow.rows[0];
    if (transfer.status === "confirmed") {
      await client.query("ROLLBACK");
      return res.json({ status: "confirmed", alreadyConfirmed: true });
    }
    if (transfer.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Yêu cầu này đã bị hủy." });
    }

    const txRes = await client.query(
      `INSERT INTO savings_transactions (savings_account_id, user_id, type, amount, note_encrypted, tx_date)
       VALUES ($1, $2, 'deposit', $3, $4, CURRENT_DATE)
       RETURNING id`,
      [transfer.savings_account_id, req.user.id, transfer.amount, encrypt(`Chuyen khoan QR - ${transfer.ref_code}`)]
    );

    await client.query(
      "UPDATE transfer_requests SET status = 'confirmed', confirmed_at = now(), savings_transaction_id = $1 WHERE id = $2",
      [txRes.rows[0].id, transfer.id]
    );

    await client.query("COMMIT");
    await logAction(req.user.id, "QR_DEPOSIT_CONFIRM", `ref=${transfer.ref_code} amount=${transfer.amount}`, req.ip);

    res.json({ status: "confirmed", amount: Number(transfer.amount) });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

async function cancelQrDeposit(req, res, next) {
  try {
    const result = await pool.query(
      "UPDATE transfer_requests SET status = 'cancelled' WHERE ref_code = $1 AND user_id = $2 AND status = 'pending' RETURNING id",
      [req.params.refCode, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Không thể hủy yêu cầu này." });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
