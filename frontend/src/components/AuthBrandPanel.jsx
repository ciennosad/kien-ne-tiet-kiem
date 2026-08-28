import React from "react";
import { Wallet, ShieldCheck, PiggyBank, LineChart } from "lucide-react";
import { theme } from "../theme.js";

const points = [
  { icon: LineChart, text: "Theo dõi thu chi và báo cáo trực quan theo tháng" },
  { icon: PiggyBank, text: "Lập sổ tiết kiệm, đặt mục tiêu và nạp tiền dễ dàng" },
  { icon: ShieldCheck, text: "Du lieu ma hoa, dang nhap bao ve bang JWT + bcrypt" },
];

export default function AuthBrandPanel() {
  return (
    <div
      style={{
        flex: 1,
        background: `linear-gradient(160deg, ${theme.color.sidebar} 0%, #1c1f3a 100%)`,
        color: "#fff",
        padding: "56px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: theme.color.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wallet size={18} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.2 }}>FinKeep</span>
      </div>

      <div>
        <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.3, margin: "0 0 14px", letterSpacing: -0.5 }}>
          Kiem soat chi tieu,<br />xay dung khoan tiet kiem.
        </h1>
        <p style={{ color: "#b6b9cc", fontSize: 14, lineHeight: 1.6, marginBottom: 28, maxWidth: 340 }}>
          Mot noi duy nhat de ghi nhan thu chi hang ngay va nuoi lon cac muc tieu tiet kiem cua ban.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {points.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <p.icon size={15} color="#c7c9e0" />
              </div>
              <span style={{ fontSize: 13, color: "#d8dae8" }}>{p.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#6b6f8a" }}>Do an mon hoc &middot; Ky thuat phan mem</div>
    </div>
  );
}
