import React from "react";
import { Wallet, LayoutDashboard, Receipt, Target, PiggyBank, HandCoins, Settings as SettingsIcon, LogOut } from "lucide-react";
import { theme } from "../theme.js";

const NAV_ITEMS = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "transactions", label: "Giao dịch", icon: Receipt },
  { id: "budgets", label: "Ngân sách", icon: Target },
  { id: "savings", label: "Tiết kiệm", icon: PiggyBank },
  { id: "debts", label: "Nợ vay", icon: HandCoins },
  { id: "settings", label: "Cài đặt", icon: SettingsIcon },
];

export default function Sidebar({ tab, setTab, user, onLogout }) {
  return (
    <div style={{
      width: 220, background: theme.color.sidebar, color: "#fff",
      display: "flex", flexDirection: "column", padding: "20px 14px", boxSizing: "border-box",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 28 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: theme.color.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wallet size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.2 }}>FinKeep</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: theme.radius.sm, border: "none", cursor: "pointer",
                background: active ? theme.color.sidebarActive : "transparent",
                color: active ? "#fff" : theme.color.sidebarMuted,
                fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: "left",
                transition: "background 0.15s",
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, display: "flex", alignItems: "center", gap: 10, padding: "14px 8px 0" }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", background: theme.color.primarySoft,
          color: theme.color.primaryDark, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {(user?.name || "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
          <div style={{ fontSize: 10.5, color: theme.color.sidebarMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
        </div>
        <button onClick={onLogout} title="Đăng xuất" style={{ background: "none", border: "none", color: theme.color.sidebarMuted, cursor: "pointer", display: "flex" }}>
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
