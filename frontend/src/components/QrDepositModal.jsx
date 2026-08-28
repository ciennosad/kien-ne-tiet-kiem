import React, { useState, useEffect, useRef } from "react";
import { X, QrCode, CheckCircle2, Loader2, AlertTriangle, Copy, Check } from "lucide-react";
import client from "../api/client";
import { fmt } from "../utils.js";
import { theme } from "../theme.js";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: theme.radius.sm,
  border: `1px solid ${theme.color.border}`, marginBottom: 14, marginTop: 5,
  boxSizing: "border-box", fontSize: 13.5, fontFamily: theme.font.family,
};

// step: "amount" -> "qr" -> "success"
export default function QrDepositModal({ account, onClose, onSuccess }) {
  const [step, setStep] = useState("amount");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [transfer, setTransfer] = useState(null); // { refCode, qrUrl, bank, amount }
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  async function handleCreateQr() {
    if (!amount || Number(amount) <= 0) return setError("Nhập số tiền hợp lệ.");
    setError("");
    setBusy(true);
    try {
      const { data } = await client.post(`/savings/${account.id}/qr-deposit/initiate`, { amount: Number(amount) });
      setTransfer(data);
      setStep("qr");
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await client.get(`/savings/qr-deposit/${data.refCode}/status`);
          if (statusRes.data.status === "confirmed") {
            clearInterval(pollRef.current);
            setStep("success");
          }
        } catch {
          /* bo qua loi poll tam thoi */
        }
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tạo mã QR, thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function handleManualConfirm() {
    setConfirming(true);
    try {
      await client.post(`/savings/qr-deposit/${transfer.refCode}/confirm`);
      clearInterval(pollRef.current);
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xác nhận, thử lại.");
    } finally {
      setConfirming(false);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(transfer.refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleClose() {
    clearInterval(pollRef.current);
    if (step === "success") onSuccess();
    else onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,17,26,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}>
      <div style={{ background: theme.color.surface, borderRadius: theme.radius.lg, padding: 22, width: 360, boxSizing: "border-box", boxShadow: theme.shadow.pop }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: theme.color.text, display: "flex", alignItems: "center", gap: 7 }}>
            <QrCode size={17} /> Nạp tiền qua QR
          </span>
          <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.textMuted }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: theme.color.textMuted, marginBottom: 16 }}>So tiet kiem: {account.name}</div>

        {step === "amount" && (
          <>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.color.text }}>Số tiền muốn nạp (đ)</label>
            <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} autoFocus placeholder="Vi du: 500000" />

            {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 12, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}

            <button onClick={handleCreateQr} disabled={busy} style={{
              width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
              background: theme.color.primary, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {busy ? <><Loader2 size={15} className="spin" /> Dang tao ma QR...</> : "Tạo mã QR chuyển khoản"}
            </button>
          </>
        )}

        {step === "qr" && transfer && (
          <>
            <div style={{ textAlign: "center", background: theme.color.surfaceAlt, borderRadius: theme.radius.md, padding: 16, marginBottom: 14, border: `1px solid ${theme.color.border}` }}>
              <img src={transfer.qrUrl} alt="Mã QR chuyển khoản VietQR" style={{ width: 220, height: "auto", borderRadius: 8, margin: "0 auto", display: "block", background: "#fff" }} />
            </div>

            <div style={{ fontSize: 12.5, color: theme.color.text, lineHeight: 1.9, marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.color.textMuted }}>Ngân hàng</span><b>{transfer.bank.accountName}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.color.textMuted }}>Số tài khoản</span><b>{transfer.bank.accountNumber}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: theme.color.textMuted }}>Số tiền</span><b>{fmt(transfer.amount)}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: theme.color.textMuted }}>Nội dung CK</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <b>{transfer.refCode}</b>
                  <button onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.primary, display: "flex" }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 11.5, color: theme.color.textMuted, background: theme.color.warningSoft, borderRadius: 8, padding: "8px 10px", marginBottom: 14 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              Giu dung noi dung chuyen khoan ({transfer.refCode}) de he thong doi chieu chinh xac giao dich cua ban.
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12.5, color: theme.color.textMuted, marginBottom: 14 }}>
              <Loader2 size={14} className="spin" /> Dang cho xac nhan chuyen khoan...
            </div>

            {error && <div style={{ color: theme.color.danger, fontSize: 12, marginBottom: 12, background: theme.color.dangerSoft, padding: "8px 10px", borderRadius: 8 }}>{error}</div>}

            <button onClick={handleManualConfirm} disabled={confirming} style={{
              width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
              background: theme.color.success, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            }}>
              {confirming ? "Đang xác nhận..." : "Tôi đã chuyển khoản xong"}
            </button>
            <div style={{ fontSize: 10.5, color: theme.color.textFaint, textAlign: "center", marginTop: 8 }}>
              Chi bam sau khi da chuyen khoan that qua ung dung ngan hang cua ban.
            </div>
          </>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: theme.color.successSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <CheckCircle2 size={30} color={theme.color.success} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.color.text, marginBottom: 4 }}>Nạp tiền thành công!</div>
            <div style={{ fontSize: 13, color: theme.color.textMuted, marginBottom: 18 }}>
              Da cong {fmt(transfer.amount)} vao so "{account.name}"
            </div>
            <button onClick={handleClose} style={{
              width: "100%", padding: 11, borderRadius: theme.radius.sm, border: "none",
              background: theme.color.primary, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            }}>
              Dong
            </button>
          </div>
        )}
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
