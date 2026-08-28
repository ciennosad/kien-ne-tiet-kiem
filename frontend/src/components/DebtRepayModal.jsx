import React, { useState } from "react";
import { X } from "lucide-react";
import { theme } from "../theme.js";
import { fmt, todayStr } from "../utils.js";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: theme.radius.sm,
  border: `1px solid ${theme.color.border}`, marginBottom: 14, marginTop: 5,
  boxSizing: "border-box", fontSize: 13.5, fontFamily: theme.font.family,
};

export default function DebtRepayModal({ debt, onClose, onConfirm }) {
  const isBorrow = debt.type === "borrow";
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (!amount || Number(amount) <= 0) return setError("Nhập số tiền hợp lệ.");
    if (Number(amount) > debt.remaining) return setError("Số tiền vượt quá số nợ còn lại.");
    setError("");
    setBusy(true);
    try {
      await onConfirm({ amount: Number(amount), note, date });
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra, thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,17,26,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div style={{ background: theme.color.surface, borderRadius: theme.radius.lg, padding: 22, width: 340, boxSizing: "border-box", boxShadow: theme.shadow.pop }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: theme.color.text }}>
            {isBorrow ? "Trả nợ cho" : "Thu nợ từ"} {debt.counterparty}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: theme.color.textMuted, marginBottom: 16 }}>Còn lại: {fmt(debt.remaining)}</div>

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Số tiền (đ)</label>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} autoFocus />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Ghi chú - không bắt buộc</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Ngày</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />

        {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 10, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}

        <button onClick={handleConfirm} disabled={busy} style={{
          width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
          background: isBorrow ? theme.color.danger : theme.color.success, color: "#fff",
          fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginTop: 4,
        }}>
          {busy ? "Đang xử lý..." : isBorrow ? "Xác nhận đã trả" : "Xác nhận đã thu"}
        </button>
      </div>
    </div>
  );
}
