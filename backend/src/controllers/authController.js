const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { logAction } = require("../utils/audit");

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const DEFAULT_CATEGORIES = [
  { name: "Ăn uống", type: "expense", color: "#eb6834" },
  { name: "Nhà ở", type: "expense", color: "#2a78d6" },
  { name: "Di chuyển", type: "expense", color: "#1baf7a" },
  { name: "Giải trí", type: "expense", color: "#eda100" },
  { name: "Khac", type: "expense", color: "#898781" },
  { name: "Luong", type: "income", color: "#008300" },
  { name: "Thu nhập khác", type: "income", color: "#4a3aa7" },
];

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email này đã được đăng ký." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role",
      [name, email, passwordHash]
    );
    const user = result.rows[0];

    // Tao san danh muc mac dinh cho nguoi dung moi
    for (const cat of DEFAULT_CATEGORIES) {
      await pool.query(
        "INSERT INTO categories (user_id, name, type, color) VALUES ($1, $2, $3, $4)",
        [user.id, cat.name, cat.type, cat.color]
      );
    }

    await logAction(user.id, "REGISTER", `Tai khoan moi: ${email}`, req.ip);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, failed_login_count, locked_until FROM users WHERE email = $1",
      [email]
    );
    const genericError = { status: 401, message: "Email hoặc mật khẩu không đúng." };
    if (result.rows.length === 0) return next(genericError);

    const user = result.rows[0];

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return next({ status: 423, message: "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau." });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const failedCount = user.failed_login_count + 1;
      const shouldLock = failedCount >= MAX_FAILED_ATTEMPTS;
      await pool.query(
        "UPDATE users SET failed_login_count = $1, locked_until = $2 WHERE id = $3",
        [
          shouldLock ? 0 : failedCount,
          shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
          user.id,
        ]
      );
      await logAction(user.id, "LOGIN_FAILED", `Lan thu ${failedCount}`, req.ip);
      return next(genericError);
    }

    await pool.query(
      "UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = $1",
      [user.id]
    );
    await logAction(user.id, "LOGIN_SUCCESS", null, req.ip);

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const accessToken = signAccessToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Thiếu refresh token." });

    const payload = verifyRefreshToken(refreshToken);
    const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [payload.sub]);
    if (result.rows.length === 0) return res.status(401).json({ message: "Tài khoản không tồn tại." });

    const accessToken = signAccessToken(result.rows[0]);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn." });
  }
}

async function me(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy người dùng." });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, me };
