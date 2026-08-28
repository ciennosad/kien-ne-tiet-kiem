require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("Đã tạo/cập nhật schema thành công.");
  } catch (err) {
    console.error("Loi khi chay migration:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
