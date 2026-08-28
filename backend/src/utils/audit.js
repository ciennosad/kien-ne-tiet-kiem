const pool = require("../config/db");

// Ghi lai nhat ky hanh dong quan trong (dang nhap, sua/xoa giao dich...) de
// phuc vu truy vet khi co su co bao mat.
async function logAction(userId, action, detail, ipAddress) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, detail, ip_address) VALUES ($1, $2, $3, $4)",
      [userId || null, action, detail || null, ipAddress || null]
    );
  } catch (err) {
    // Khong de loi ghi log lam sap request chinh, chi in cảnh báo ra console
    console.error("Khong the ghi audit log:", err.message);
  }
}

module.exports = { logAction };
