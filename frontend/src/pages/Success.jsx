import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Success() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("user");
    if (!raw) {
      navigate("/", { replace: true });
      return;
    }
    setUser(JSON.parse(raw));
  }, [navigate]);

  function handleLogout() {
    sessionStorage.removeItem("user");
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
      </div>

      <button className="btn btn-secondary" onClick={handleLogout}>
        로그아웃
      </button>
    </div>
  );
}
