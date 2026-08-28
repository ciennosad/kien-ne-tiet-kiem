import React, { useState, useMemo } from "react";
import { Plus, Trash2, Pencil, Search } from "lucide-react";
import { fmt } from "../utils.js";
import { theme } from "../theme.js";

export default function TransactionsTab({ transactions, categories, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [String(c.id), c])), [categories]);

  const filtered = transactions
    .filter((t) => (filterCat === "all" ? true : String(t.category) === filterCat))
    .filter((t) => t.note.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: 11, color: theme.color.textFaint }} />
          <input placeholder="Tìm theo ghi chú..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 10px 9px 34px", borderRadius: theme.radius.sm, border: `1px solid ${theme.color.border}`, fontSize: 13.5, boxSizing: "border-box", background: theme.color.surface }} />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          style={{ padding: "0 12px", borderRadius: theme.radius.sm, border: `1px solid ${theme.color.border}`, fontSize: 13.5, background: theme.color.surface, color: theme.color.text }}>
          <option value="all">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={onAdd} style={{
          display: "flex", alignItems: "center", gap: 6, background: theme.color.primary, color: "#fff",
          border: "none", borderRadius: theme.radius.sm, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
        }}>
          <Plus size={15} /> Thêm
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: theme.color.textFaint, fontSize: 13, background: theme.color.surface, borderRadius: theme.radius.md, border: `1px dashed ${theme.color.borderStrong}` }}>
          Không có giao dich nao
        </div>
      ) : (
        <div style={{ background: theme.color.surface, borderRadius: theme.radius.md, border: `1px solid ${theme.color.border}`, overflow: "hidden", boxShadow: theme.shadow.card }}>
          {filtered.map((t, i) => {
            const cat = catMap[String(t.category)];
            return (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px",
                borderBottom: i < filtered.length - 1 ? `1px solid ${theme.color.border}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: (cat?.color || "#ccc") + "1c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: cat?.color || "#ccc", display: "inline-block" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: theme.color.text }}>{t.note || cat?.name || "Giao dịch"}</div>
                    <div style={{ fontSize: 11.5, color: theme.color.textFaint }}>{cat?.name} &middot; {t.date}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: t.type === "income" ? theme.color.success : theme.color.danger }}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                  <button onClick={() => onEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.textMuted }}><Pencil size={14} /></button>
                  <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.color.danger }}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
