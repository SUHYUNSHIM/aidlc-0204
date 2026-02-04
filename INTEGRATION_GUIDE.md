# Frontend-Backend 통합 가이드

Customer Frontend와 Backend API를 연동하여 실행하는 방법입니다.

## 🚀 빠른 시작

### 방법 1: Mock 모드 (Backend 없이)

```bash
cd customer-frontend
npm install
cp .env.mock .env
npm run dev
```

- URL: http://localhost:5173
- 테스트 계정: store-1 / 테이블 1 / password

### 방법 2: Backend 연동 모드

#### Step 1: Backend 서버 실행

```bash
# 터미널 1
cd backend
pip install -r requirements.txt
python run.py
```

Backend API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

#### Step 2: Frontend 서버 실행

```bash
# 터미널 2
cd customer-frontend
npm install
cp .env.development .env
npm run dev
```

Frontend: http://localhost:5173

## 📋 환경 설정

### Frontend 환경 변수 (.env)

```env
# Mock 모드
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:8000

# Backend 연동 모드
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000
```

### Backend 환경 변수 (.env)

```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS (Frontend URL 허용)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/db

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRATION_HOURS=16
```

## 🔗 API 엔드포인트 매핑

| 기능 | Frontend | Backend API |
|------|----------|-------------|
| 로그인 | `authService.login()` | `POST /api/v1/auth/table/login` |
| 메뉴 조회 | `menuService.fetchMenus()` | `GET /api/v1/customer/menus` |
| 카테고리 조회 | `menuService.fetchCategories()` | `GET /api/v1/customer/menus` |
| 주문 생성 | `orderService.createOrder()` | `POST /api/v1/customer/orders` |
| 주문 내역 | `orderService.fetchOrders()` | `GET /api/v1/customer/orders` |

## 🔧 개발 모드 전환

### Mock → Backend 전환

```bash
cd customer-frontend
# .env 파일 수정
echo "VITE_USE_MOCK=false" > .env
echo "VITE_API_URL=http://localhost:8000" >> .env

# 개발 서버 재시작
npm run dev
```

### Backend → Mock 전환

```bash
cd customer-frontend
# .env 파일 수정
echo "VITE_USE_MOCK=true" > .env

# 개발 서버 재시작
npm run dev
```

## 🧪 테스트

### Frontend 테스트

```bash
cd customer-frontend
npm test              # 단위 테스트
npm run test:ui       # UI 테스트
npm run test:coverage # 커버리지
```

### Backend 테스트

```bash
cd backend
pytest                # 전체 테스트
pytest -v             # 상세 출력
pytest --cov          # 커버리지
```

## 🐛 문제 해결

### CORS 에러

Backend `.env`에서 Frontend URL 확인:
```env
CORS_ORIGINS=http://localhost:5173
```

### 401 Unauthorized

1. 로그인 API 응답에서 JWT 토큰 확인
2. Frontend axios interceptor에서 토큰 전송 확인
3. Backend JWT 설정 확인

### 연결 거부 (Connection Refused)

1. Backend 서버 실행 확인: `http://localhost:8000`
2. Frontend `.env`의 `VITE_API_URL` 확인
3. 방화벽 설정 확인

## 📦 프로덕션 빌드

### Frontend

```bash
cd customer-frontend
npm run build
# dist/ 폴더에 빌드 결과 생성
```

### Backend

```bash
cd backend
# 프로덕션 환경 변수 설정
export ENVIRONMENT=production
export DEBUG=false

# Gunicorn으로 실행
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🔐 보안 설정

프로덕션 환경에서는 반드시:

1. JWT_SECRET_KEY 변경
2. CORS_ORIGINS 제한
3. DEBUG=false 설정
4. HTTPS 사용
5. 환경 변수 암호화

## 📚 추가 문서

- [Frontend README](customer-frontend/README.md)
- [Backend API Docs](http://localhost:8000/docs)
- [Architecture Design](aidlc-docs/inception/application-design/)
