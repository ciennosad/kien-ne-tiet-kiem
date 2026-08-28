import React, { useState, useEffect } from "react";
import { Landmark, CheckCircle2, Info } from "lucide-react";
import client from "../api/client";
import { theme } from "../theme.js";
import { BANKS } from "../bankList.js";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: theme.radius.sm,
  border: `1px solid ${theme.color.border}`, marginBottom: 14, marginTop: 5,
  boxSizing: "border-box", fontSize: 13.5, fontFamily: theme.font.family,
};

export default function Settings() {
  const [bankBin, setBankBin] = useState("");
  const [customBin, setCustomBin] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    client.get("/users/bank-account").then((res) => {
      const known = BANKS.find((b) => b.bin === res.data.bankBin);
      if (res.data.bankBin && !known) {
        setBankBin("other");
        setCustomBin(res.data.bankBin);
      } else {
        setBankBin(res.data.bankBin || "");
      }
      setAccountNumber(res.data.accountNumber || "");
      setAccountName(res.data.accountName || "");
      setLoading(false);
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const finalBin = bankBin === "other" ? customBin : bankBin;
    if (!/^\d{6}$/.test(finalBin)) return setError("Mã ngân hàng (BIN) phải gồm 6 chữ số.");
    if (!accountNumber.trim()) return setError("Nhập số tài khoản ngân hàng.");
    if (!accountName.trim()) return setError("Nhập tên chủ tài khoản (không dấu, viết hoa).");

    setSaving(true);
    try {
      await client.put("/users/bank-account", { bankBin: finalBin, accountNumber: accountNumber.trim(), accountName: accountName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu, thử lại.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ color: theme.color.textFaint, padding: 40, textAlign: "center" }}>Đang tải...</div>;

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: theme.color.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Landmark size={16} color={theme.color.primary} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.color.text }}>Tài khoản ngân hàng nhận tiền</div>
      </div>
      <p style={{ fontSize: 12.5, color: theme.color.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
        Thong tin nay dung de sinh ma QR chuyen khoan (chuan VietQR) moi khi ban nap tien vao so tiet kiem.
        Chi luu tren tai khoan cua ban, dung de hien thi QR, khong chia se cho nguoi khac.
      </p>

      <form onSubmit={handleSave} style={{ background: theme.color.surface, border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.md, padding: 20, boxShadow: theme.shadow.card }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Ngân hàng</label>
        <select value={bankBin} onChange={(e) => setBankBin(e.target.value)} style={inputStyle}>
          <option value="">-- Chon ngan hang --</option>
          {BANKS.map((b) => <option key={b.bin} value={b.bin}>{b.name}</option>)}
          <option value="other">Ngân hàng khác (nhập mã BIN)</option>
        </select>

        {bankBin === "other" && (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Mã BIN ngân hàng (6 chữ số)</label>
            <input value={customBin} onChange={(e) => setCustomBin(e.target.value)} style={inputStyle} placeholder="Tra cứu tại vietqr.io/danh-sach-ngan-hang" />
          </>
        )}

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Số tài khoản</label>
        <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle} placeholder="Vi du: 0123456789" />

        <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Tên chủ tài khoản (không dấu)</label>
        <input value={accountName} onChange={(e) => setAccountName(e.target.value.toUpperCase())} style={inputStyle} placeholder="NGUYEN VAN A" />

        {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 12, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: theme.color.success, fontSize: 12, marginBottom: 12, background: theme.color.successSoft, padding: "8px 10px", borderRadius: 8 }}>
            <CheckCircle2 size={14} /> Da luu thong tin ngan hang
          </div>
        )}

        <button type="submit" disabled={saving} style={{
          width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
          background: theme.color.primary, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
        }}>
          {saving ? "Đang lưu..." : "Lưu thông tin"}
        </button>
      </form>

      <div style={{ display: "flex", gap: 8, marginTop: 16, padding: "12px 14px", background: theme.color.primarySoft, borderRadius: theme.radius.sm, fontSize: 12, color: theme.color.primaryDark, lineHeight: 1.6 }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Sau khi lưu, vào mục <strong>Tiết kiệm</strong> &rarr; chon so tiet kiem &rarr; <strong>Nạp tiền</strong> &rarr; <strong>Nạp qua QR</strong> de tao ma chuyen khoan.</span>
      </div>
    </div>
  );
}
