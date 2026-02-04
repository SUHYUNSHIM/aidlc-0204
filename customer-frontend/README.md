# Customer Frontend - 테이블 오더 서비스

고객용 프론트엔드 애플리케이션

## 실행 방법

### 1. Mock 모드 (백엔드 없이 테스트)

```bash
cd customer-frontend
npm install
cp .env.mock .env
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

**테스트 계정**:
- Store ID: `store-1`
- Table Number: `1`
- Password: `password` 또는 `1234`

### 2. Backend 연동 모드

#### Backend 서버 실행

```bash
# 터미널 1: Backend 서버
cd backend
pip install -r requirements.txt
python run.py
```

Backend가 `http://localhost:8000`에서 실행됩니다.

#### Frontend 실행

```bash
# 터미널 2: Frontend 서버
cd customer-frontend
npm install
cp .env.development .env
npm run dev
```

Frontend가 `http://localhost:5173`에서 실행됩니다.

## 환경 변수 설정

### Mock 모드
```env
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:8000
```

### Backend 연동 모드
```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
```

## API 엔드포인트 매핑

| Frontend 기능 | Backend API |
|--------------|-------------|
| 로그인 | `POST /api/v1/auth/table/login` |
| 메뉴 조회 | `GET /api/v1/customer/menus` |
| 주문 생성 | `POST /api/v1/customer/orders` |
| 주문 내역 | `GET /api/v1/customer/orders` |

## 개발 스크립트

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 미리보기
npm test             # 테스트 실행
```

## 기술 스택

- React 18
- TypeScript
- Vite
- React Query
- Axios
- React Router
