const { verifyAccessToken } = require("../utils/jwt");

// Middleware xac thuc: yeu cau header "Authorization: Bearer <token>".
// Gan req.user = { id, email, role } neu token hop le.
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Thiếu hoặc sai định dạng token xác thực." });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
}

// Middleware phan quyen: chi cho phep vai tro duoc liet ke (RBAC don gian)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này." });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
