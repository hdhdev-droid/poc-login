# poc-login

React + Express + **MySQL + Redis** 로 구성된 로그인 POC 입니다.

```
poc-login/
├── backend/      # Express + mysql2 API 서버 (포트 4000)
└── frontend/     # React + Vite 클라이언트 (포트 5173)
```

## 사전 요구사항

- Node.js 18 이상
- 접속 가능한 MySQL / MariaDB 인스턴스 (호스트, 포트, 계정, DB 이름)
- Redis 인스턴스 (`localhost:6379`)

## 1. MySQL 데이터베이스 준비

먼저 빈 데이터베이스(스키마)만 만들어 두면 됩니다. 테이블과 admin 계정은 서버가 기동되면서 자동 생성합니다.

```sql
CREATE DATABASE poc_login DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 필요하면 전용 계정도 생성
-- CREATE USER 'poc'@'%' IDENTIFIED BY 'changeme';
-- GRANT ALL PRIVILEGES ON poc_login.* TO 'poc'@'%';
-- FLUSH PRIVILEGES;
```

## 2. 백엔드 설정 및 실행

```bash
cd backend
cp .env.example .env   # Windows PowerShell: Copy-Item .env.example .env
# .env 파일을 열어 본인 DB 접속 정보로 수정
npm install
npm run dev
```

`.env` 예시:

```bash
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=changeme
DB_NAME=poc_login
DB_CONNECTION_LIMIT=10
```

서버가 시작되면:

- `users` 테이블이 없으면 자동 생성
- `admin` 계정이 없으면 비밀번호 `admin` (bcrypt 해시) 으로 자동 추가
- Redis 연결 성공 시 로그인 세션을 저장해서 현재 로그인 사용자 수를 집계

API:

- `POST /api/login` — body: `{ "username": "admin", "password": "admin" }`
- `POST /api/logout` — body: `{ "sessionId": "..." }`
- `POST /api/session/refresh` — body: `{ "sessionId": "..." }` (세션 TTL 갱신)
- `GET  /api/online-users` — 현재 로그인 사용자 수 반환
- `GET  /api/health` — DB 연결 상태 확인 (`SELECT 1`)

## 3. 프론트엔드 실행

새 터미널에서:

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 <http://localhost:5173> 접속 → `admin` / `admin` 으로 로그인하면 `/success` 페이지로 이동합니다. Vite 의 `/api` 프록시가 백엔드(`http://localhost:4000`) 로 요청을 전달합니다.

## 4. 동작 흐름

1. 로그인 폼에서 `username`, `password` 를 `POST /api/login` 으로 전송
2. 백엔드는 MySQL 의 `users` 테이블을 조회 → `bcrypt.compare` 로 비밀번호 검증
3. 성공 시 사용자 정보 + `sessionId` 를 응답 → 프론트엔드는 `sessionStorage` 에 저장 후 성공 페이지로 라우팅
4. 성공 페이지에서 사용자 정보 + 현재 로그인 사용자 수를 표시하고 로그아웃 가능

## 메모

- Redis는 기본적으로 `localhost:6379` 에 연결합니다.
- 기존 `index.html` 은 정적 데모로 남겨두었습니다.
- POC 용이므로 세션/JWT, HTTPS, rate limit 등은 의도적으로 생략되어 있습니다.
