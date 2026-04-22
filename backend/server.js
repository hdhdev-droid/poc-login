import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { findUserByUsername, initDatabase, pool } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "down", message: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "아이디와 비밀번호를 모두 입력해주세요." });
  }

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }

    return res.json({
      success: true,
      message: "로그인에 성공했습니다.",
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("[login] error:", err);
    return res
      .status(500)
      .json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

async function bootstrap() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[server] http://localhost:${PORT} 에서 실행 중`);
    });
  } catch (err) {
    console.error("[server] DB 초기화 실패. .env 의 접속 정보를 확인하세요.");
    console.error(err);
    process.exit(1);
  }
}

bootstrap();
