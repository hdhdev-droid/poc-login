import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "data.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function seedDefaultAdmin() {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE username = ?")
    .get("admin");

  if (row.count === 0) {
    const hash = bcrypt.hashSync("admin", 10);
    db.prepare(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)"
    ).run("admin", hash);
    console.log("[db] 기본 admin 계정을 생성했습니다 (admin / admin)");
  }
}

seedDefaultAdmin();

export function findUserByUsername(username) {
  return db
    .prepare("SELECT id, username, password_hash, created_at FROM users WHERE username = ?")
    .get(username);
}

export default db;
