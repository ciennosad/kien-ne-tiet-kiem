import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthBrandPanel from "../components/AuthBrandPanel.jsx";
import { theme } from "../theme.js";

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: theme.radius.sm,
  border: `1px solid ${theme.color.border}`,
  marginTop: 6,
  marginBottom: 16,
  boxSizing: "border-box",
  fontSize: 14,
  fontFamily: theme.font.family,
  outline: "none",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Vui lòng nhập đầy đủ email và mật khẩu.");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập không thành công.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: theme.font.family, background: theme.color.bg }}>
      <div style={{ display: "none" }} className="hide-mobile" />
      <AuthBrandPanel />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ width: 360 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: theme.color.text }}>Chào mừng trở lại</h2>
          <p style={{ fontSize: 13, color: theme.color.textMuted, margin: "0 0 28px" }}>Đăng nhập để tiếp tục quản lý tài chính của bạn.</p>

          <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="ban@vidu.com" />

          <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Mật khẩu</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} placeholder="********" />

          {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 12, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}

          <button type="submit" disabled={busy} style={{
            width: "100%", padding: 12, borderRadius: theme.radius.sm, border: "none",
            background: theme.color.primary, color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <LogIn size={15} /> {busy ? "Đang xử lý..." : "Đăng nhập"}
          </button>

          <p style={{ fontSize: 13, textAlign: "center", marginTop: 20, color: theme.color.textMuted }}>
            Chưa có tai khoan? <Link to="/register" style={{ color: theme.color.primary, fontWeight: 600, textDecoration: "none" }}>Đăng ký ngay</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
