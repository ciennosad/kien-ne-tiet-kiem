import React, { useState } from "react";
import { X } from "lucide-react";
import { theme } from "../theme.js";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: theme.radius.sm,
  border: `1px solid ${theme.color.border}`, marginBottom: 14, marginTop: 5,
  boxSizing: "border-box", fontSize: 13.5, fontFamily: theme.font.family,
};

export default function DebtModal({ onClose, onSave }) {
  const [type, setType] = useState("borrow");
  const [counterparty, setCounterparty] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!counterparty.trim()) return setError(type === "borrow" ? "Nhập tên người cho bạn vay." : "Nhập tên người vay tiền bạn.");
    if (!principal || Number(principal) <= 0) return setError("Nhập số tiền gốc hợp lệ.");
    setError("");
    setBusy(true);
    try {
      await onSave({
        type,
        counterparty: counterparty.trim(),
        principal: Number(principal),
        interestRate: interestRate ? Number(interestRate) : 0,
        dueDate: dueDate || null,
        note,
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
          <span style={{ fontWeight: 700, fontSize: 16, color: theme.color.text }}>Thêm khoản nợ</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.textMuted }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            { id: "borrow", label: "Tôi vay" },
            { id: "lend", label: "Tôi cho vay" },
          ].map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              flex: 1, padding: 9, borderRadius: theme.radius.sm, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: type === t.id ? `1px solid ${theme.color.primary}` : `1px solid ${theme.color.border}`,
              background: type === t.id ? theme.color.primary : theme.color.surface,
              color: type === t.id ? "#fff" : theme.color.text,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>
          {type === "borrow" ? "Vay của ai" : "Cho ai vay"}
        </label>
        <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} style={inputStyle} placeholder="Tên người / đơn vị" />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Số tiền gốc (đ)</label>
        <input type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} style={inputStyle} />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Lãi suất %/năm - không bắt buộc</label>
        <input type="number" min="0" max="100" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} style={inputStyle} />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Hạn trả - không bắt buộc</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Ghi chú - không bắt buộc</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />

        {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 10, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}

        <button onClick={handleSave} disabled={busy} style={{
          width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
          background: theme.color.primary, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginTop: 4,
        }}>
          {busy ? "Đang lưu..." : "Lưu khoản nợ"}
        </button>
      </div>
    </div>
  );
}
