import React, { useState } from "react";
import { X } from "lucide-react";
import { todayStr } from "../utils.js";
import { theme } from "../theme.js";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: theme.radius.sm,
  border: `1px solid ${theme.color.border}`, marginBottom: 14, marginTop: 5,
  boxSizing: "border-box", fontSize: 13.5, fontFamily: theme.font.family,
};

export default function TxModal({ categories, initial, onClose, onSave }) {
  const [type, setType] = useState(initial?.type || "expense");
  const [amount, setAmount] = useState(initial?.amount || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [note, setNote] = useState(initial?.note || "");
  const [date, setDate] = useState(initial?.date || todayStr());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const availableCats = categories.filter((c) => c.type === type);

  async function handleSave() {
    if (!amount || Number(amount) <= 0) return setError("Nhập số tiền hợp lệ (lớn hơn 0)");
    if (!category) return setError("Chọn danh mục");
    setError("");
    setBusy(true);
    try {
      await onSave({ type, amount: Number(amount), category, note, date });
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
          <span style={{ fontWeight: 700, fontSize: 16, color: theme.color.text }}>{initial ? "Sửa giao dịch" : "Thêm giao dịch"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.textMuted }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["expense", "income"].map((t) => (
            <button key={t} onClick={() => { setType(t); setCategory(""); }}
              style={{
                flex: 1, padding: 9, borderRadius: theme.radius.sm, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: type === t ? `1px solid ${theme.color.primary}` : `1px solid ${theme.color.border}`,
                background: type === t ? theme.color.primary : theme.color.surface,
                color: type === t ? "#fff" : theme.color.text,
              }}>
              {t === "expense" ? "Chi tiêu" : "Thu nhập"}
            </button>
          ))}
        </div>

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Số tiền (đ)</label>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} autoFocus />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Danh mục</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          <option value="">-- Chọn danh mục --</option>
          {availableCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Ghi chú</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder="Không bắt buộc" />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Ngày</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />

        {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 10, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}

        <button onClick={handleSave} disabled={busy} style={{
          width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
          background: theme.color.primary, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginTop: 4,
        }}>
          {busy ? "Đang lưu..." : initial ? "Lưu thay đổi" : "Thêm giao dịch"}
        </button>
      </div>
    </div>
  );
}
