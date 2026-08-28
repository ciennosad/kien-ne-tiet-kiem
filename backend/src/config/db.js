const { Pool } = require("pg");

// Ket noi CSDL qua connection pool. Khong bao gio noi chuoi SQL thu cong o noi khac
// trong du an nay - luon dung tham so hoa ($1, $2, ...) de chong SQL Injection.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Loi khong mong muon tu PostgreSQL pool:", err);
});

module.exports = pool;
