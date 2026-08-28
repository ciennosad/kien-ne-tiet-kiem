-- Schema co so du lieu cho ung dung Quan ly chi tieu ca nhan
-- Chay: psql -U postgres -d expense_manager -f src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP NULL,
  bank_bin VARCHAR(10),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(150),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(20) NOT NULL DEFAULT '#898781',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  -- Ghi chu duoc ma hoa AES-256-GCM truoc khi luu (xem src/utils/crypto.js)
  note_encrypted TEXT,
  tx_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- dinh dang YYYY-MM
  limit_amount NUMERIC(14, 2) NOT NULL CHECK (limit_amount > 0),
  UNIQUE (user_id, category_id, month)
);

CREATE TABLE IF NOT EXISTS savings_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  goal_amount NUMERIC(14, 2), -- muc tieu tiet kiem, co the de trong (khong dat muc tieu)
  interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0, -- lai suat nam (%) de uoc tinh, chi mang tinh tham khao
  color VARCHAR(20) NOT NULL DEFAULT '#4f46e5',
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS savings_transactions (
  id SERIAL PRIMARY KEY,
  savings_account_id INTEGER NOT NULL REFERENCES savings_accounts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  note_encrypted TEXT,
  tx_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_tx_account ON savings_transactions (savings_account_id);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_user ON savings_accounts (user_id);

-- Yeu cau nap tien qua QR chuyen khoan ngan hang (VietQR). Trang thai "pending" duoc
-- tao khi sinh ma QR; chuyen sang "confirmed" khi nguoi dung xac nhan da chuyen khoan
-- xong, luc do he thong moi cong tien vao savings_transactions (xem savingsController.js).
CREATE TABLE IF NOT EXISTS transfer_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  savings_account_id INTEGER NOT NULL REFERENCES savings_accounts(id) ON DELETE CASCADE,
  ref_code VARCHAR(30) UNIQUE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  savings_transaction_id INTEGER REFERENCES savings_transactions(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_requests_ref ON transfer_requests (ref_code);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_user ON transfer_requests (user_id);

-- Quan ly no vay: "borrow" = khoan ban vay cua nguoi khac (ban la nguoi no),
-- "lend" = khoan ban cho nguoi khac vay (nguoi khac no ban).
CREATE TABLE IF NOT EXISTS debts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('borrow', 'lend')),
  counterparty VARCHAR(150) NOT NULL, -- ten nguoi cho vay / nguoi vay
  principal_amount NUMERIC(14, 2) NOT NULL CHECK (principal_amount > 0),
  interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  due_date DATE,
  note_encrypted TEXT,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debt_repayments (
  id SERIAL PRIMARY KEY,
  debt_id INTEGER NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  note_encrypted TEXT,
  tx_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_user ON debts (user_id);
CREATE INDEX IF NOT EXISTS idx_debt_repayments_debt ON debt_repayments (debt_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, tx_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions (user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets (user_id, month);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
