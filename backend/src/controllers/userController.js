const pool = require("../config/db");
const { logAction } = require("../utils/audit");

async function getBankAccount(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT bank_bin, bank_account_number, bank_account_name FROM users WHERE id = $1",
      [req.user.id]
    );
    const row = result.rows[0];
    res.json({
      bankBin: row.bank_bin || "",
      accountNumber: row.bank_account_number || "",
      accountName: row.bank_account_name || "",
    });
  } catch (err) {
    next(err);
  }
}

async function updateBankAccount(req, res, next) {
  try {
    const { bankBin, accountNumber, accountName } = req.body;
    await pool.query(
      "UPDATE users SET bank_bin = $1, bank_account_number = $2, bank_account_name = $3 WHERE id = $4",
      [bankBin, accountNumber, accountName.toUpperCase(), req.user.id]
    );
    await logAction(req.user.id, "BANK_ACCOUNT_UPDATE", `bin=${bankBin}`, req.ip);
    res.json({ bankBin, accountNumber, accountName: accountName.toUpperCase() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBankAccount, updateBankAccount };
