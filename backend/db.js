import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "poc_login",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

export async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [rows] = await conn.query(
      "SELECT COUNT(*) AS count FROM users WHERE username = ?",
      ["admin"]
    );

    if (rows[0].count === 0) {
      const hash = bcrypt.hashSync("admin", 10);
      await conn.query(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        ["admin", hash]
      );
      console.log("[db] 기본 admin 계정을 생성했습니다 (admin / admin)");
    }
  } finally {
    conn.release();
  }
}

export async function findUserByUsername(username) {
  const [rows] = await pool.query(
    "SELECT id, username, password_hash, created_at FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  return rows[0];
}
