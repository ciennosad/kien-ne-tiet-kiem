import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, PiggyBank } from "lucide-react";
import { fmt, monthLabel } from "../utils.js";
import { theme } from "../theme.js";

function StatCard({ label, value, color, icon: Icon, iconBg }) {
  return (
    <div style={{ background: theme.color.surface, borderRadius: theme.radius.md, padding: "16px 18px", flex: 1, border: `1px solid ${theme.color.border}`, boxShadow: theme.shadow.card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: theme.color.textMuted, fontSize: 12.5, fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: theme.color.text, letterSpacing: -0.3 }}>{fmt(value)}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: theme.color.surface, borderRadius: theme.radius.md, padding: 18, border: `1px solid ${theme.color.border}`, boxShadow: theme.shadow.card }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.color.text, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function EmptyNote({ text }) {
  return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: theme.color.textFaint, fontSize: 13 }}>{text}</div>;
}

export default function OverviewTab({ summary, budgetStatus, savingsTotal }) {
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const byCategory = summary?.byCategory || [];
  const trend = (summary?.trend || []).map((t) => ({ ...t, label: monthLabel(t.month) }));
  const overBudget = (budgetStatus || []).filter((b) => b.pct >= 90);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
        <StatCard label="Thu nhập" value={income} color={theme.color.success} iconBg={theme.color.successSoft} icon={TrendingUp} />
        <StatCard label="Chi tiêu" value={expense} color={theme.color.danger} iconBg={theme.color.dangerSoft} icon={TrendingDown} />
        <StatCard label="Số dư" value={income - expense} color={theme.color.primary} iconBg={theme.color.primarySoft} icon={Wallet} />
        <StatCard label="Đang tiết kiệm" value={savingsTotal || 0} color="#7c3aed" iconBg="#f3f0ff" icon={PiggyBank} />
      </div>

      {overBudget.map((b) => (
        <div key={b.id} style={{
          display: "flex", alignItems: "center", gap: 8, background: theme.color.warningSoft,
          border: "1px solid #f5d99b", borderRadius: theme.radius.sm, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: "#8a5a10",
        }}>
          <AlertTriangle size={15} />
          Danh mục "{b.name}" đã dùng {b.pct}% ngan sach ({fmt(b.spent)} / {fmt(b.limit)})
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Panel title="Chi tiêu theo danh mục">
          {byCategory.length === 0 ? (
            <EmptyNote text="Chưa có chi tiêu tháng này" />
          ) : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} stroke={theme.color.surface} strokeWidth={2} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${theme.color.border}`, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, fontSize: 11, color: theme.color.textMuted }}>
                {byCategory.map((c) => (
                  <span key={c.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: "inline-block" }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Xu hướng thu chi">
          {trend.length === 0 ? (
            <EmptyNote text="Chưa có dữ liệu" />
          ) : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid stroke={theme.color.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: theme.color.textMuted }} axisLine={{ stroke: theme.color.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: theme.color.textMuted }} tickFormatter={(v) => (v / 1000000).toFixed(1) + "tr"} width={38} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: `1px solid ${theme.color.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="income" name="Thu" stroke={theme.color.success} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="expense" name="Chi" stroke={theme.color.danger} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
