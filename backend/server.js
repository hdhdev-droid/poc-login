import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { findUserByUsername } from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "아이디와 비밀번호를 모두 입력해주세요." });
  }

  const user = findUserByUsername(username);
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
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT} 에서 실행 중`);
});
