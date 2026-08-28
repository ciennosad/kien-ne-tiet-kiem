import React, { useState } from "react";
import { fmt } from "../utils.js";
import { theme } from "../theme.js";

export default function BudgetsTab({ categories, budgets, byCategory, month, onSetLimit }) {
  const expenseCats = categories.filter((c) => c.type === "expense");
  const [drafts, setDrafts] = useState({});

  function limitFor(catId) {
    if (drafts[catId] !== undefined) return drafts[catId];
    return budgets.find((b) => b.categoryId === catId)?.limit || "";
  }

  function handleBlur(catId) {
    const val = Number(drafts[catId]);
    if (val > 0) onSetLimit(catId, val);
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: theme.color.textMuted, marginBottom: 16, maxWidth: 560 }}>
        Dat han muc chi tieu cho tung danh muc trong thang {month}. He thong se cảnh báo khi ban chi gan vuot muc.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {expenseCats.map((c) => {
          const spent = byCategory.find((b) => b.name === c.name)?.value || 0;
          const limit = budgets.find((b) => b.categoryId === c.id)?.limit || 0;
          const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const barColor = pct >= 90 ? theme.color.danger : pct >= 70 ? theme.color.warning : theme.color.success;
          return (
            <div key={c.id} style={{ background: theme.color.surface, borderRadius: theme.radius.md, border: `1px solid ${theme.color.border}`, padding: 16, boxShadow: theme.shadow.card }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, color: theme.color.text }}>
                  <span style={{ width: 9, height: 9, borderRadius: 5, background: c.color, display: "inline-block" }} />
                  {c.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: theme.color.textMuted }}>Han muc:</span>
                <input type="number" min="0" placeholder="Nhập số tiền"
                  value={limitFor(c.id)}
                  onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                  onBlur={() => handleBlur(c.id)}
                  style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1px solid ${theme.color.border}`, fontSize: 12.5, textAlign: "right" }} />
              </div>
              {limit > 0 ? (
                <>
                  <div style={{ height: 7, background: theme.color.surfaceAlt, borderRadius: 6, overflow: "hidden", border: `1px solid ${theme.color.border}` }}>
                    <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 6 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.color.textMuted, marginTop: 6 }}>{fmt(spent)} / {fmt(limit)} ({pct}%)</div>
                </>
              ) : (
                <div style={{ fontSize: 11.5, color: theme.color.textFaint }}>Chưa đặt hạn mức cho danh mục này</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
