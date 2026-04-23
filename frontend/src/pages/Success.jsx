import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(null);
  const [infoError, setInfoError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    const sessionId = sessionStorage.getItem("sessionId");
    if (!raw) {
      navigate("/", { replace: true });
      return;
    }

    if (!sessionId) {
      sessionStorage.removeItem("user");
      navigate("/", { replace: true });
      return;
    }

    setUser(JSON.parse(raw));

    const refreshOnlineUsers = async () => {
      try {
        const res = await fetch("/api/session/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "세션 갱신에 실패했습니다.");
        }
        setOnlineUsers(data.onlineUsers);
        setInfoError("");
      } catch (err) {
        console.error(err);
        setInfoError("접속 사용자 수를 불러오지 못했습니다.");
      }
    };

    refreshOnlineUsers();
    const intervalId = setInterval(refreshOnlineUsers, 15000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  async function handleLogout() {
    const sessionId = sessionStorage.getItem("sessionId");
    if (sessionId) {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionId");
    navigate("/", { replace: true });
  }

  if (!user) return null;

  return (
    <div className="card">
      <div className="success-icon">✓</div>
      <div className="header">
        <h1>로그인 성공</h1>
        <p>환영합니다, {user.username}님!</p>
      </div>

      <div className="user-info">
        <div>
          <strong>사용자 ID:</strong> {user.id}
        </div>
        <div>
          <strong>아이디:</strong> {user.username}
        </div>
        <div>
          <strong>가입일:</strong> {user.createdAt}
        </div>
        <div>
          <strong>현재 로그인 사용자 수:</strong>{" "}
          {onlineUsers === null ? "불러오는 중..." : `${onlineUsers}명`}
        </div>
      </div>

      {infoError && <div className="alert alert-info">{infoError}</div>}

      <button className="btn btn-secondary" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}
