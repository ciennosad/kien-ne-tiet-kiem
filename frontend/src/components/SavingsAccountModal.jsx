import React, { useState } from "react";
import { X } from "lucide-react";
import { theme, CATEGORY_PALETTE } from "../theme.js";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: theme.radius.sm,
  border: `1px solid ${theme.color.border}`, marginBottom: 14, marginTop: 5,
  boxSizing: "border-box", fontSize: 13.5, fontFamily: theme.font.family,
};

export default function SavingsAccountModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [color, setColor] = useState(CATEGORY_PALETTE[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!name.trim()) return setError("Nhập tên cho sổ tiết kiệm.");
    setError("");
    setBusy(true);
    try {
      await onSave({
        name: name.trim(),
        goalAmount: goalAmount ? Number(goalAmount) : null,
        interestRate: interestRate ? Number(interestRate) : 0,
        color,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra, thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,17,26,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ background: theme.color.surface, borderRadius: theme.radius.lg, padding: 22, width: 360, boxSizing: "border-box", boxShadow: theme.shadow.pop }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: theme.color.text }}>Sổ tiết kiệm mới</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.textMuted }}><X size={18} /></button>
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Tên mục tiêu</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Vi du: Quy du phong, Mua xe..." />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Số tiền mục tiêu (đ) - không bắt buộc</label>
        <input type="number" min="0" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} style={inputStyle} placeholder="Vi du: 20000000" />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Lãi suất tham khảo %/năm - không bắt buộc</label>
        <input type="number" min="0" max="100" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} style={inputStyle} placeholder="Vi du: 4.5" />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text, display: "block", marginBottom: 8 }}>Màu sắc</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {CATEGORY_PALETTE.map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer",
              border: color === c ? `2px solid ${theme.color.text}` : "2px solid transparent",
              outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 1,
            }} />
          ))}
        </div>

        {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 10, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}

        <button onClick={handleSave} disabled={busy} style={{
          width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
          background: theme.color.primary, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
        }}>
          {busy ? "Đang tạo..." : "Tạo sổ tiết kiệm"}
        </button>
      </div>
    </div>
  );
}
