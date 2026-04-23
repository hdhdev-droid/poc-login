import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { findUserByUsername, initDatabase, pool } from "./db.js";
import {
  connectRedis,
  getOnlineUserCount,
  refreshUserSession,
  registerUserSession,
  unregisterUserSession,
} from "./redis.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  let db = "up";
  let redis = "up";

  try {
    await pool.query("SELECT 1");
  } catch (_err) {
    db = "down";
  }

  let onlineUsers = 0;
  try {
    onlineUsers = await getOnlineUserCount();
  } catch (err) {
    redis = "down";
  }

  if (db === "down" || redis === "down") {
    return res.status(500).json({ status: "error", db, redis, onlineUsers });
  }

  return res.json({ status: "ok", db, redis, onlineUsers });
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

    const sessionId = crypto.randomUUID();
    await registerUserSession(user.id, sessionId);
    const onlineUsers = await getOnlineUserCount();

    return res.json({
      success: true,
      message: "로그인에 성공했습니다.",
      sessionId,
      onlineUsers,
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

app.post("/api/logout", async (req, res) => {
  const { sessionId } = req.body ?? {};

  if (!sessionId) {
    return res.status(400).json({ success: false, message: "sessionId가 필요합니다." });
  }

  try {
    await unregisterUserSession(sessionId);
    const onlineUsers = await getOnlineUserCount();
    return res.json({ success: true, onlineUsers });
  } catch (err) {
    console.error("[logout] error:", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

app.get("/api/online-users", async (_req, res) => {
  try {
    const onlineUsers = await getOnlineUserCount();
    return res.json({ success: true, onlineUsers });
  } catch (err) {
    console.error("[online-users] error:", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

app.post("/api/session/refresh", async (req, res) => {
  const { sessionId } = req.body ?? {};

  if (!sessionId) {
    return res.status(400).json({ success: false, message: "sessionId가 필요합니다." });
  }

  try {
    const refreshed = await refreshUserSession(sessionId);
    if (!refreshed.ok) {
      return res.status(401).json({ success: false, message: "세션이 만료되었습니다." });
    }

    const onlineUsers = await getOnlineUserCount();
    return res.json({ success: true, onlineUsers });
  } catch (err) {
    console.error("[session-refresh] error:", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

async function bootstrap() {
  try {
    await initDatabase();
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`[server] http://localhost:${PORT} 에서 실행 중`);
    });
  } catch (err) {
    console.error("[server] 초기화 실패. DB/Redis 연결 정보를 확인하세요.");
    console.error(err);
    process.exit(1);
  }
}

bootstrap();
