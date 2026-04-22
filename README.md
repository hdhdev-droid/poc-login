# poc-login

React + Express + SQLite 로 구성된 로그인 POC 입니다.

```
poc-login/
├── backend/      # Express + better-sqlite3 API 서버 (포트 4000)
└── frontend/     # React + Vite 클라이언트 (포트 5173)
```

## 사전 요구사항

- Node.js 18 이상

## 1. 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

- 서버가 시작되면 `backend/data.db` SQLite 파일이 자동 생성됩니다.
- `users` 테이블이 없으면 만들고, `admin` 계정이 없으면 비밀번호 `admin` (bcrypt 해시) 으로 자동 추가됩니다.
- API:
  - `POST /api/login` `{ "username": "admin", "password": "admin" }`
  - `GET /api/health`

## 2. 프론트엔드 실행

새 터미널에서:

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 <http://localhost:5173> 접속 → `admin` / `admin` 으로 로그인하면 `/success` 페이지로 이동합니다.

Vite 의 `/api` 프록시가 백엔드(`http://localhost:4000`) 로 요청을 전달합니다.

## 3. 동작 흐름

1. 로그인 폼에서 `username`, `password` 를 `POST /api/login` 으로 전송
2. 백엔드는 SQLite 의 `users` 테이블을 조회 → `bcrypt.compare` 로 비밀번호 검증
3. 성공 시 사용자 정보를 응답 → 프론트엔드는 `sessionStorage` 에 저장 후 성공 페이지로 라우팅
4. 성공 페이지에서 사용자 정보를 표시하고 로그아웃 가능

## 메모

- 기존 `index.html` 은 정적 데모로 남겨두었습니다. 실제 풀스택 버전은 `backend/` + `frontend/` 를 사용하세요.
- POC 용이므로 세션/JWT, HTTPS, rate limit 등은 의도적으로 생략되어 있습니다.
