require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const { apiLimiter } = require("./middleware/rateLimiter");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const savingsRoutes = require("./routes/savingsRoutes");
const userRoutes = require("./routes/userRoutes");
const debtRoutes = require("./routes/debtRoutes");

const app = express();

// --- Bao mat co ban (theo yeu cau mon An toan va bao mat thong tin) ---
app.use(helmet()); // dat cac HTTP header bao mat (X-Frame-Options, CSP co ban...)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" })); // gioi han kich thuoc body de tranh DoS
app.use(morgan("combined"));
app.use(apiLimiter);

// --- Routes ---
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/debts", debtRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend dang chay tai http://localhost:${PORT}`);
});
