# Unit of Work 의존성

## 의존성 매트릭스

| 유닛 | 의존하는 유닛 | 의존성 타입 | 통합 포인트 |
|------|--------------|------------|-----------|
| **Customer Frontend** | Backend API | Runtime | HTTP REST API |
| **Admin Frontend** | Backend API | Runtime | HTTP REST API + SSE |
| **Backend API** | Database Schema | Runtime | PostgreSQL Connection |
| **Database Schema** | None | - | - |

---

## 의존성 상세

### Customer Frontend → Backend API

**의존성 타입**: Runtime Dependency

**통합 포인트**:
- `POST /customer/login` - 테이블 로그인
- `GET /customer/menus?store_id={id}` - 메뉴 조회
- `POST /customer/orders` - 주문 생성
- `GET /customer/orders?session_id={id}` - 주문 내역 조회

**데이터 흐름**:
```
Customer UI Component
    ↓ (React Query)
HTTP Request (Axios)
    ↓ (REST API)
Backend API Endpoint
```

**에러 처리**:
- 네트워크 에러: 재시도 로직 (React Query)
- 인증 에러 (401): 자동 로그아웃 및 로그인 화면 리다이렉트
- 서버 에러 (500): 에러 메시지 표시

**Mock 전략** (개발 중):
- MSW (Mock Service Worker) 사용
- Mock 데이터: `frontend/src/mocks/handlers.js`
- 개발 모드에서 자동 활성화

---

### Admin Frontend → Backend API

**의존성 타입**: Runtime Dependency

**통합 포인트**:

**HTTP REST API**:
- `POST /admin/login` - 관리자 로그인
- `GET /admin/orders?store_id={id}` - 주문 목록 조회
- `PATCH /admin/orders/{id}/status` - 주문 상태 변경
- `DELETE /admin/orders/{id}` - 주문 삭제
- `POST /admin/tables` - 테이블 생성
- `POST /admin/tables/{id}/end-session` - 세션 종료
- `GET /admin/tables/{id}/history` - 과거 주문 내역
- `GET /admin/menus?store_id={id}` - 메뉴 목록
- `POST /admin/menus` - 메뉴 생성
- `PATCH /admin/menus/{id}` - 메뉴 수정
- `DELETE /admin/menus/{id}` - 메뉴 삭제

**Server-Sent Events**:
- `GET /admin/orders/sse?store_id={id}` - 실시간 주문 업데이트

**데이터 흐름**:

**HTTP 요청**:
```
Admin UI Component
    ↓ (React Query)
HTTP Request (Axios)
    ↓ (REST API)
Backend API Endpoint
```

**SSE 연결**:
```
Admin UI (OrderDashboard)
    ↓ (EventSource)
SSE Connection
    ↓ (Server-Sent Events)
Backend API SSE Endpoint
    ↓
SSEService
```

**에러 처리**:
- 네트워크 에러: 재시도 로직
- 인증 에러 (401): 자동 로그아웃 및 로그인 화면 리다이렉트
- SSE 연결 끊김: 자동 재연결 (지수 백오프) + 사용자 알림
- 서버 에러 (500): 에러 메시지 표시

**Mock 전략** (개발 중):
- MSW 사용 (HTTP API)
- SSE Mock: `frontend/src/mocks/sse-mock.js`
- 개발 모드에서 자동 활성화

---

### Backend API → Database Schema

**의존성 타입**: Runtime Dependency

**통합 포인트**:
- PostgreSQL 연결 (SQLAlchemy)
- 데이터베이스: `table_order_db`
- 포트: `5432`
- 연결 풀: 최소 5, 최대 20

**데이터 흐름**:
```
Service Layer
    ↓ (method call)
Repository Layer
    ↓ (SQLAlchemy ORM)
Database Connection Pool
    ↓ (PostgreSQL Protocol)
PostgreSQL Database
```

**트랜잭션 관리**:
- Repository 레이어에서 트랜잭션 시작/커밋/롤백
- 서비스 레이어는 비즈니스 로직만 처리
- 에러 발생 시 자동 롤백

**마이그레이션**:
- Alembic 사용
- 마이그레이션 파일: `database/migrations/versions/`
- 자동 마이그레이션 실행: 애플리케이션 시작 시

**에러 처리**:
- 연결 에러: 재시도 로직 (최대 3회)
- 쿼리 에러: 로깅 후 예외 발생
- 트랜잭션 에러: 롤백 후 예외 발생

---

## 개발 단계별 의존성

### Phase 1: 독립 개발 (Mock 사용)

```
Customer Frontend (독립)
    ↓ (Mock API)
MSW Mock Handlers

Admin Frontend (독립)
    ↓ (Mock API + Mock SSE)
MSW Mock Handlers

Backend API (독립)
    ↓ (Test Database)
PostgreSQL Test DB

Database Schema (독립)
    ↓
PostgreSQL Dev DB
```

### Phase 2: 부분 통합

```
Customer Frontend
    ↓ (Real API)
Backend API
    ↓ (Real Database)
PostgreSQL Dev DB

Admin Frontend
    ↓ (Real API + Real SSE)
Backend API
```

### Phase 3: 전체 통합

```
Customer Frontend ─┐
                   ├─→ Backend API ─→ PostgreSQL DB
Admin Frontend ────┘
```

---

## 통합 테스트 전략

### 지속적 통합 체크포인트

**Checkpoint 1: Database Schema 완성**
- 모든 테이블 생성 확인
- 인덱스 및 제약조건 검증
- 샘플 데이터 시딩 성공

**Checkpoint 2: Backend API 기본 기능**
- 인증 API 동작 확인
- CRUD API 동작 확인
- 데이터베이스 연결 확인

**Checkpoint 3: Customer Frontend 통합**
- Mock API → Real API 전환
- 로그인 플로우 테스트
- 주문 생성 플로우 테스트 (End-to-End)

**Checkpoint 4: Admin Frontend 통합**
- Mock API → Real API 전환
- SSE 연결 테스트
- 주문 모니터링 플로우 테스트 (End-to-End)

**Checkpoint 5: 전체 통합**
- 고객 주문 → 관리자 대시보드 실시간 업데이트
- 관리자 상태 변경 → 고객 주문 내역 반영
- 세션 종료 → 과거 내역 이동

---

## 통합 포인트 계약

### API 계약 (OpenAPI/Swagger)

**문서 위치**: `backend/docs/openapi.json`

**주요 스키마**:

**LoginRequest**:
```json
{
  "store_id": "string",
  "username": "string",
  "password": "string"
}
```

**LoginResponse**:
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 57600
}
```

**OrderCreate**:
```json
{
  "items": [
    {
      "menu_id": 1,
      "quantity": 2
    }
  ]
}
```

**OrderResponse**:
```json
{
  "order_id": 123,
  "order_number": "ORD-20260204-001",
  "table_id": 5,
  "table_number": 5,
  "total_amount": 25000,
  "status": "대기중",
  "order_time": "2026-02-04T13:30:00Z",
  "items": [
    {
      "menu_id": 1,
      "menu_name": "김치찌개",
      "quantity": 2,
      "unit_price": 9000
    }
  ]
}
```

**SSE Event**:
```json
{
  "event_type": "order_created",
  "data": {
    "order_id": 123,
    "table_id": 5,
    "table_number": 5,
    "total_amount": 25000,
    "status": "대기중",
    "items": [...]
  }
}
```

---

## 의존성 관리

### Frontend 의존성
- React Query: 서버 상태 관리 및 캐싱
- Axios: HTTP 클라이언트
- React Router: 라우팅
- EventSource: SSE 클라이언트 (브라우저 내장)

### Backend 의존성
- FastAPI: 웹 프레임워크
- SQLAlchemy: ORM
- Alembic: 마이그레이션
- python-jose: JWT
- bcrypt: 비밀번호 해싱
- asyncio: 비동기 처리

### Database 의존성
- PostgreSQL 14+
- pg_trgm extension (검색 기능용, 선택)

---

## 환경 변수

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_MOCK=false
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/table_order_db
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=16
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=INFO
```

### Database (.env)
```
POSTGRES_USER=table_order_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=table_order_db
POSTGRES_PORT=5432
```

---

## 통합 실행 순서

### 로컬 개발 환경 시작

1. **Database 시작**:
```bash
docker-compose up -d postgres
```

2. **Database 마이그레이션**:
```bash
cd backend
alembic upgrade head
```

3. **Backend API 시작**:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

4. **Frontend 시작**:
```bash
cd frontend
npm run dev
```

5. **접속**:
- Customer UI: `http://localhost:5173/customer`
- Admin UI: `http://localhost:5173/admin`
- API Docs: `http://localhost:8000/docs`

---

## 의존성 버전 관리

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0"
  }
}
```

### Backend (requirements.txt)
```
fastapi==0.109.0
uvicorn==0.27.0
sqlalchemy==2.0.25
alembic==1.13.0
python-jose[cryptography]==3.3.0
bcrypt==4.1.2
asyncpg==0.29.0
```

---

## 통합 테스트 시나리오

### Scenario 1: 고객 주문 생성 → 관리자 실시간 수신
1. Customer Frontend: 주문 생성
2. Backend API: 주문 저장 + SSE 브로드캐스트
3. Admin Frontend: SSE로 실시간 수신 및 대시보드 업데이트
4. 검증: 주문이 2초 이내에 관리자 화면에 표시

### Scenario 2: 관리자 상태 변경 → 고객 주문 내역 반영
1. Admin Frontend: 주문 상태 "준비중"으로 변경
2. Backend API: 상태 업데이트
3. Customer Frontend: 주문 내역 조회 시 변경된 상태 확인
4. 검증: 상태가 정확히 반영됨

### Scenario 3: 세션 종료 → 데이터 아카이브
1. Admin Frontend: 테이블 세션 종료
2. Backend API: 주문을 OrderHistory로 이동
3. Database: 트랜잭션 커밋
4. 검증: 과거 내역에서 조회 가능, 현재 주문 목록에서 제거
