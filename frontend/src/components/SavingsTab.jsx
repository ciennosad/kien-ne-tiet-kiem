import React, { useState, useRef, useEffect } from "react";
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, Target, QrCode, PencilLine } from "lucide-react";
import { fmt } from "../utils.js";
import { theme } from "../theme.js";

function DepositChoice({ anchorRef, onPickQr, onPickManual, onClose }) {
  useEffect(() => {
    function handler(e) {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{
      position: "absolute", top: "110%", left: 0, right: 0, background: theme.color.surface,
      border: `1px solid ${theme.color.border}`, borderRadius: theme.radius.sm, boxShadow: theme.shadow.pop,
      zIndex: 20, overflow: "hidden",
    }}>
      <button onClick={onPickQr} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none",
        border: "none", cursor: "pointer", fontSize: 12.5, color: theme.color.text, textAlign: "left",
      }}>
        <QrCode size={14} color={theme.color.primary} /> Nạp qua QR chuyen khoan
      </button>
      <button onClick={onPickManual} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none",
        border: "none", borderTop: `1px solid ${theme.color.border}`, cursor: "pointer", fontSize: 12.5, color: theme.color.text, textAlign: "left",
      }}>
        <PencilLine size={14} color={theme.color.textMuted} /> Ghi nhan thu cong (tien mat)
      </button>
    </div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 7, background: theme.color.surfaceAlt, borderRadius: 6, overflow: "hidden", border: `1px solid ${theme.color.border}` }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 6, transition: "width 0.3s" }} />
    </div>
  );
}

function SavingsCard({ account, onDepositQr, onDepositManual, onWithdraw, onDelete }) {
  const pct = account.goalAmount ? Math.round((account.balance / account.goalAmount) * 100) : null;
  const [choiceOpen, setChoiceOpen] = useState(false);
  const anchorRef = useRef(null);

  return (
    <div style={{
      background: theme.color.surface, borderRadius: theme.radius.md, border: `1px solid ${theme.color.border}`,
      padding: 18, boxShadow: theme.shadow.card, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: account.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={16} color={account.color} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.text }}>{account.name}</div>
            <div style={{ fontSize: 11, color: theme.color.textFaint }}>
              {account.interestRate > 0 ? `Lai suat tham khao ${account.interestRate}%/nam` : "Không tính lãi"}
            </div>
          </div>
        </div>
        <button onClick={() => onDelete(account.id)} style={{ background: "none", border: "none", color: theme.color.textFaint, cursor: "pointer" }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: theme.color.text }}>{fmt(account.balance)}</div>
        {account.goalAmount && (
          <div style={{ fontSize: 11.5, color: theme.color.textMuted, marginTop: 2 }}>
            trong mục tiêu {fmt(account.goalAmount)}
          </div>
        )}
      </div>

      {account.goalAmount && (
        <div>
          <ProgressBar pct={pct} color={account.color} />
          <div style={{ fontSize: 11, color: theme.color.textMuted, marginTop: 5 }}>{pct}% hoàn thành</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <div ref={anchorRef} style={{ position: "relative", flex: 1 }}>
          <button onClick={() => setChoiceOpen((v) => !v)} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 10px", borderRadius: theme.radius.sm, border: "none",
            background: theme.color.primary, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>
            <ArrowDownCircle size={14} /> Nạp tiền
          </button>
          {choiceOpen && (
            <DepositChoice
              anchorRef={anchorRef}
              onClose={() => setChoiceOpen(false)}
              onPickQr={() => { setChoiceOpen(false); onDepositQr(account); }}
              onPickManual={() => { setChoiceOpen(false); onDepositManual(account); }}
            />
          )}
        </div>
        <button onClick={() => onWithdraw(account)} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 10px", borderRadius: theme.radius.sm, border: `1px solid ${theme.color.border}`,
          background: theme.color.surface, color: theme.color.text, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}>
          <ArrowUpCircle size={14} /> Rút tiền
        </button>
      </div>
    </div>
  );
}

export default function SavingsTab({ accounts, onAdd, onDepositQr, onDepositManual, onWithdraw, onDelete }) {
  const totalSavings = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      <div style={{
        background: `linear-gradient(135deg, ${theme.color.primary}, #7c3aed)`, borderRadius: theme.radius.md,
        padding: "18px 22px", color: "#fff", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Tổng tiền đang tiết kiệm</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{fmt(totalSavings)}</div>
        </div>
        <button onClick={onAdd} style={{
          display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.16)",
          border: "1px solid rgba(255,255,255,0.3)", borderRadius: theme.radius.sm, color: "#fff",
          padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <Plus size={15} /> Sổ tiết kiệm mới
        </button>
      </div>

      {accounts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px", color: theme.color.textFaint, background: theme.color.surface,
          borderRadius: theme.radius.md, border: `1px dashed ${theme.color.borderStrong}`,
        }}>
          Ban chua co so tiet kiem nao. Tao so dau tien de bat dau tich luy cho muc tieu cua ban.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {accounts.map((a) => (
            <SavingsCard key={a.id} account={a} onDepositQr={onDepositQr} onDepositManual={onDepositManual} onWithdraw={onWithdraw} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
