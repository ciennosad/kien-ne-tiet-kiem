import React from "react";
import { Plus, HandCoins, Handshake, Trash2, CheckCircle2, CalendarClock } from "lucide-react";
import { fmt } from "../utils.js";
import { theme } from "../theme.js";

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 7, background: theme.color.surfaceAlt, borderRadius: 6, overflow: "hidden", border: `1px solid ${theme.color.border}` }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 6 }} />
    </div>
  );
}

function DebtCard({ debt, onRepay, onDelete }) {
  const pct = debt.principal > 0 ? Math.round((debt.paid / debt.principal) * 100) : 0;
  const isBorrow = debt.type === "borrow";
  const color = isBorrow ? theme.color.danger : theme.color.success;
  const overdue = debt.dueDate && !debt.isClosed && new Date(debt.dueDate) < new Date(new Date().toDateString());

  return (
    <div style={{
      background: theme.color.surface, borderRadius: theme.radius.md, border: `1px solid ${theme.color.border}`,
      padding: 18, boxShadow: theme.shadow.card, display: "flex", flexDirection: "column", gap: 12,
      opacity: debt.isClosed ? 0.6 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isBorrow ? <HandCoins size={16} color={color} /> : <Handshake size={16} color={color} />}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.color.text }}>{debt.counterparty}</div>
            <div style={{ fontSize: 11, color: theme.color.textFaint }}>
              {isBorrow ? "Khoản bạn vay" : "Khoản bạn cho vay"}
              {debt.interestRate > 0 && ` · Lãi ${debt.interestRate}%/năm`}
            </div>
          </div>
        </div>
        <button onClick={() => onDelete(debt.id)} style={{ background: "none", border: "none", color: theme.color.textFaint, cursor: "pointer" }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.color.text }}>{fmt(debt.remaining)}</div>
        <div style={{ fontSize: 11.5, color: theme.color.textMuted, marginTop: 2 }}>còn lại trên tổng {fmt(debt.principal)}</div>
      </div>

      <div>
        <ProgressBar pct={pct} color={color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: 11, color: theme.color.textMuted }}>Đã {isBorrow ? "trả" : "thu"} {pct}%</span>
          {debt.dueDate && (
            <span style={{ fontSize: 11, color: overdue ? theme.color.danger : theme.color.textFaint, display: "flex", alignItems: "center", gap: 3 }}>
              <CalendarClock size={11} /> {overdue ? "Quá hạn" : "Hạn"} {debt.dueDate}
            </span>
          )}
        </div>
      </div>

      {debt.isClosed ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 10px", borderRadius: theme.radius.sm, background: theme.color.successSoft, color: theme.color.success, fontSize: 12.5, fontWeight: 600 }}>
          <CheckCircle2 size={14} /> Đã tất toán
        </div>
      ) : (
        <button onClick={() => onRepay(debt)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 10px", borderRadius: theme.radius.sm, border: "none",
          background: color, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        }}>
          {isBorrow ? "Ghi nhận trả nợ" : "Ghi nhận thu nợ"}
        </button>
      )}
    </div>
  );
}

export default function DebtsTab({ debts, onAdd, onRepay, onDelete }) {
  const borrowed = debts.filter((d) => d.type === "borrow");
  const lent = debts.filter((d) => d.type === "lend");
  const totalOwe = borrowed.filter((d) => !d.isClosed).reduce((s, d) => s + d.remaining, 0);
  const totalOwed = lent.filter((d) => !d.isClosed).reduce((s, d) => s + d.remaining, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1, background: theme.color.dangerSoft, borderRadius: theme.radius.md, padding: "16px 18px", border: "1px solid #f3caca" }}>
          <div style={{ fontSize: 12, color: "#9b3232", marginBottom: 4 }}>Tổng bạn đang nợ</div>
          <div style={{ fontSize: 21, fontWeight: 700, color: theme.color.danger }}>{fmt(totalOwe)}</div>
        </div>
        <div style={{ flex: 1, background: theme.color.successSoft, borderRadius: theme.radius.md, padding: "16px 18px", border: "1px solid #bfe3cc" }}>
          <div style={{ fontSize: 12, color: "#1f7a44", marginBottom: 4 }}>Tổng người khác nợ bạn</div>
          <div style={{ fontSize: 21, fontWeight: 700, color: theme.color.success }}>{fmt(totalOwed)}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={onAdd} style={{
          display: "flex", alignItems: "center", gap: 6, background: theme.color.primary, color: "#fff",
          border: "none", borderRadius: theme.radius.sm, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <Plus size={15} /> Thêm khoản nợ
        </button>
      </div>

      {debts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px", color: theme.color.textFaint, background: theme.color.surface,
          borderRadius: theme.radius.md, border: `1px dashed ${theme.color.borderStrong}`,
        }}>
          Chưa có khoản nợ nào được ghi nhận.
        </div>
      ) : (
        <>
          {borrowed.length > 0 && (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.color.textMuted, marginBottom: 10 }}>KHOẢN BẠN VAY</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginBottom: 22 }}>
                {borrowed.map((d) => <DebtCard key={d.id} debt={d} onRepay={onRepay} onDelete={onDelete} />)}
              </div>
            </>
          )}
          {lent.length > 0 && (
            <>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.color.textMuted, marginBottom: 10 }}>KHOẢN CHO VAY</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {lent.map((d) => <DebtCard key={d.id} debt={d} onRepay={onRepay} onDelete={onDelete} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
