import React, { useState, useEffect, useCallback } from "react";
import { Lock, ChevronDown } from "lucide-react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";
import OverviewTab from "../components/OverviewTab.jsx";
import TransactionsTab from "../components/TransactionsTab.jsx";
import BudgetsTab from "../components/BudgetsTab.jsx";
import SavingsTab from "../components/SavingsTab.jsx";
import TxModal from "../components/TxModal.jsx";
import SavingsAccountModal from "../components/SavingsAccountModal.jsx";
import SavingsMoveModal from "../components/SavingsMoveModal.jsx";
import QrDepositModal from "../components/QrDepositModal.jsx";
import DebtsTab from "../components/DebtsTab.jsx";
import DebtModal from "../components/DebtModal.jsx";
import DebtRepayModal from "../components/DebtRepayModal.jsx";
import Settings from "./Settings.jsx";
import { todayStr } from "../utils.js";
import { theme } from "../theme.js";

const TAB_TITLES = {
  dashboard: "Tổng quan",
  transactions: "Giao dịch",
  budgets: "Ngân sách",
  savings: "Tiết kiệm",
  debts: "Nợ vay",
  settings: "Cài đặt",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [month, setMonth] = useState(todayStr().slice(0, 7));

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [debts, setDebts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [savingsModalOpen, setSavingsModalOpen] = useState(false);
  const [moveModal, setMoveModal] = useState(null); // { account, mode }
  const [qrModalAccount, setQrModalAccount] = useState(null);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [repayModal, setRepayModal] = useState(null); // debt object

  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, txRes, sumRes, budRes, savRes, debtRes] = await Promise.all([
        client.get("/categories"),
        client.get("/transactions", { params: { month } }),
        client.get("/transactions/summary", { params: { month } }),
        client.get("/budgets", { params: { month } }),
        client.get("/savings"),
        client.get("/debts"),
      ]);
      setCategories(catRes.data);
      setTransactions(txRes.data);
      setSummary(sumRes.data);
      setBudgets(budRes.data);
      setSavingsAccounts(savRes.data);
      setDebts(debtRes.data);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const budgetStatus = categories
    .filter((c) => c.type === "expense")
    .map((c) => {
      const limit = budgets.find((b) => b.categoryId === c.id)?.limit || 0;
      const spent = summary?.byCategory?.find((b) => b.name === c.name)?.value || 0;
      return { ...c, limit, spent, pct: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0 };
    })
    .filter((b) => b.limit > 0);

  const savingsTotal = savingsAccounts.reduce((s, a) => s + a.balance, 0);

  async function saveTx(data) {
    if (editingTx) {
      await client.put(`/transactions/${editingTx.id}`, data);
    } else {
      await client.post("/transactions", data);
    }
    setModalOpen(false);
    setEditingTx(null);
    loadAll();
  }

  async function deleteTx(id) {
    await client.delete(`/transactions/${id}`);
    loadAll();
  }

  async function setBudgetLimit(categoryId, limit) {
    await client.post("/budgets", { categoryId, month, limit });
    loadAll();
  }

  async function createSavingsAccount(data) {
    await client.post("/savings", data);
    setSavingsModalOpen(false);
    loadAll();
  }

  async function deleteSavingsAccount(id) {
    await client.delete(`/savings/${id}`);
    loadAll();
  }

  async function handleSavingsMove(data) {
    const { account, mode } = moveModal;
    await client.post(`/savings/${account.id}/${mode}`, data);
    setMoveModal(null);
    loadAll();
  }

  async function createDebt(data) {
    await client.post("/debts", data);
    setDebtModalOpen(false);
    loadAll();
  }

  async function deleteDebt(id) {
    await client.delete(`/debts/${id}`);
    loadAll();
  }

  async function handleRepayment(data) {
    await client.post(`/debts/${repayModal.id}/repayments`, data);
    setRepayModal(null);
    loadAll();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: theme.font.family, background: theme.color.bg }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={logout} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 28px", borderBottom: `1px solid ${theme.color.border}`, background: theme.color.surface,
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: theme.color.text, margin: 0, letterSpacing: -0.3 }}>
            {TAB_TITLES[tab]}
          </h1>
          {(tab === "dashboard" || tab === "transactions" || tab === "budgets") && (
            <div style={{ position: "relative" }}>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                style={{
                  background: theme.color.surfaceAlt, border: `1px solid ${theme.color.border}`,
                  borderRadius: theme.radius.sm, padding: "8px 12px", fontSize: 13, color: theme.color.text,
                }} />
            </div>
          )}
        </div>

        <div style={{ padding: 28, flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: theme.color.textFaint }}>Đang tải dữ liệu...</div>
          ) : (
            <>
              {tab === "dashboard" && <OverviewTab summary={summary} budgetStatus={budgetStatus} savingsTotal={savingsTotal} />}
              {tab === "transactions" && (
                <TransactionsTab
                  transactions={transactions}
                  categories={categories}
                  onAdd={() => { setEditingTx(null); setModalOpen(true); }}
                  onEdit={(t) => { setEditingTx(t); setModalOpen(true); }}
                  onDelete={deleteTx}
                />
              )}
              {tab === "budgets" && (
                <BudgetsTab categories={categories} budgets={budgets} byCategory={summary?.byCategory || []} month={month} onSetLimit={setBudgetLimit} />
              )}
              {tab === "savings" && (
                <SavingsTab
                  accounts={savingsAccounts}
                  onAdd={() => setSavingsModalOpen(true)}
                  onDepositQr={(account) => setQrModalAccount(account)}
                  onDepositManual={(account) => setMoveModal({ account, mode: "deposit" })}
                  onWithdraw={(account) => setMoveModal({ account, mode: "withdraw" })}
                  onDelete={deleteSavingsAccount}
                />
              )}
              {tab === "settings" && <Settings />}
              {tab === "debts" && (
                <DebtsTab
                  debts={debts}
                  onAdd={() => setDebtModalOpen(true)}
                  onRepay={(debt) => setRepayModal(debt)}
                  onDelete={deleteDebt}
                />
              )}
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 28px", fontSize: 11, color: theme.color.textFaint, borderTop: `1px solid ${theme.color.border}` }}>
          <Lock size={12} />
          Du lieu duoc bao ve bang JWT, mat khau bam bcrypt, ghi chu ma hoa AES-256-GCM tren server.
        </div>
      </div>

      {modalOpen && (
        <TxModal categories={categories} initial={editingTx} onClose={() => { setModalOpen(false); setEditingTx(null); }} onSave={saveTx} />
      )}
      {savingsModalOpen && (
        <SavingsAccountModal onClose={() => setSavingsModalOpen(false)} onSave={createSavingsAccount} />
      )}
      {moveModal && (
        <SavingsMoveModal account={moveModal.account} mode={moveModal.mode} onClose={() => setMoveModal(null)} onConfirm={handleSavingsMove} />
      )}
      {qrModalAccount && (
        <QrDepositModal
          account={qrModalAccount}
          onClose={() => setQrModalAccount(null)}
          onSuccess={() => { setQrModalAccount(null); loadAll(); }}
        />
      )}
      {debtModalOpen && (
        <DebtModal onClose={() => setDebtModalOpen(false)} onSave={createDebt} />
      )}
      {repayModal && (
        <DebtRepayModal debt={repayModal} onClose={() => setRepayModal(null)} onConfirm={handleRepayment} />
      )}
    </div>
  );
}
