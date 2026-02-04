# Unit of Work 정의

## 프로젝트 구조 개요

**분해 전략**: 4개 유닛 (세밀 분해)
**개발 방식**: 병렬 개발
**통합 전략**: 지속적 통합
**코드 조직**: 모노레포
**배포 전략**: 로컬 개발 환경

---

## 유닛 정의

### Unit 1: Customer Frontend

**유닛 ID**: `customer-frontend`

**책임**:
- 고객용 사용자 인터페이스 제공
- 테이블 태블릿 자동 로그인
- 메뉴 조회 및 탐색
- 장바구니 관리 (localStorage)
- 주문 생성 및 내역 조회

**기술 스택**:
- React 18+
- React Router (고객 라우팅)
- React Query (서버 상태 관리)
- Context API (로컬 상태 관리)
- Axios (HTTP 클라이언트)
- localStorage (장바구니, 인증 토큰)

**주요 컴포넌트**:
- CustomerApp (루트)
- MenuBrowser
- Cart
- OrderConfirmation
- OrderHistory
- 공통 컴포넌트 (Button, Input, Modal, Toast, Loader)

**API 의존성**:
- `POST /customer/login` - 테이블 로그인
- `GET /customer/menus` - 메뉴 조회
- `POST /customer/orders` - 주문 생성
- `GET /customer/orders` - 주문 내역 조회

**디렉토리 구조**:
```
frontend/
├── src/
│   ├── customer/
│   │   ├── components/
│   │   │   ├── MenuBrowser.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── OrderConfirmation.jsx
│   │   │   └── OrderHistory.jsx
│   │   ├── contexts/
│   │   │   └── CustomerContext.jsx
│   │   ├── hooks/
│   │   │   └── useCustomerAuth.js
│   │   └── CustomerApp.jsx
│   ├── shared/
│   │   └── components/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       └── Loader.jsx
│   └── App.jsx (라우팅)
```

---

### Unit 2: Admin Frontend

**유닛 ID**: `admin-frontend`

**책임**:
- 관리자용 사용자 인터페이스 제공
- 관리자 로그인 및 인증
- 실시간 주문 모니터링 (SSE)
- 테이블 관리 (초기 설정, 세션 종료, 과거 내역)
- 메뉴 관리 (CRUD, 순서 조정)

**기술 스택**:
- React 18+
- React Router (관리자 라우팅)
- React Query (서버 상태 관리)
- Context API (로컬 상태 관리)
- Axios (HTTP 클라이언트)
- EventSource (SSE 클라이언트)
- localStorage (JWT 토큰)

**주요 컴포넌트**:
- AdminApp (루트)
- AdminLogin
- OrderDashboard
- TableCard
- OrderDetailModal
- TableManagement
- MenuManagement
- 공통 컴포넌트 (재사용)

**API 의존성**:
- `POST /admin/login` - 관리자 로그인
- `GET /admin/orders` - 주문 목록 조회
- `GET /admin/orders/sse` - 실시간 주문 업데이트
- `PATCH /admin/orders/{id}/status` - 주문 상태 변경
- `DELETE /admin/orders/{id}` - 주문 삭제
- `POST /admin/tables` - 테이블 생성
- `POST /admin/tables/{id}/end-session` - 세션 종료
- `GET /admin/tables/{id}/history` - 과거 주문 내역
- `GET /admin/menus` - 메뉴 목록
- `POST /admin/menus` - 메뉴 생성
- `PATCH /admin/menus/{id}` - 메뉴 수정
- `DELETE /admin/menus/{id}` - 메뉴 삭제

**디렉토리 구조**:
```
frontend/
├── src/
│   ├── admin/
│   │   ├── components/
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── OrderDashboard.jsx
│   │   │   ├── TableCard.jsx
│   │   │   ├── OrderDetailModal.jsx
│   │   │   ├── TableManagement.jsx
│   │   │   └── MenuManagement.jsx
│   │   ├── contexts/
│   │   │   └── AdminContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAdminAuth.js
│   │   │   └── useSSE.js
│   │   └── AdminApp.jsx
│   └── App.jsx (라우팅)
```

---

### Unit 3: Backend API

**유닛 ID**: `backend-api`

**책임**:
- RESTful API 엔드포인트 제공
- 비즈니스 로직 처리
- 데이터베이스 액세스
- JWT 인증 및 인가
- 실시간 통신 (SSE)
- 캐싱 관리

**기술 스택**:
- FastAPI (Python 3.10+)
- SQLAlchemy (ORM)
- PostgreSQL (데이터베이스)
- bcrypt (비밀번호 해싱)
- python-jose (JWT)
- asyncio (비동기 처리)
- Redis/In-Memory (캐싱)

**레이어 구조** (4-Layer):
1. **API Layer**: CustomerRouter, AdminRouter
2. **Service Layer**: AuthService, OrderService, TableService, MenuService, SSEService
3. **Repository Layer**: StoreRepository, TableRepository, OrderRepository, MenuRepository, etc.
4. **Model Layer**: SQLAlchemy Models (Store, Table, Order, Menu, etc.)

**API 엔드포인트**:

**고객용**:
- `POST /customer/login`
- `GET /customer/menus`
- `POST /customer/orders`
- `GET /customer/orders`

**관리자용**:
- `POST /admin/login`
- `GET /admin/orders`
- `GET /admin/orders/sse`
- `PATCH /admin/orders/{id}/status`
- `DELETE /admin/orders/{id}`
- `POST /admin/tables`
- `POST /admin/tables/{id}/end-session`
- `GET /admin/tables/{id}/history`
- `GET /admin/menus`
- `POST /admin/menus`
- `PATCH /admin/menus/{id}`
- `DELETE /admin/menus/{id}`

**디렉토리 구조**:
```
backend/
├── app/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── customer.py
│   │   │   └── admin.py
│   │   └── dependencies.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── order_service.py
│   │   ├── table_service.py
│   │   ├── menu_service.py
│   │   └── sse_service.py
│   ├── repositories/
│   │   ├── store_repository.py
│   │   ├── table_repository.py
│   │   ├── order_repository.py
│   │   ├── menu_repository.py
│   │   └── order_history_repository.py
│   ├── models/
│   │   ├── store.py
│   │   ├── table.py
│   │   ├── order.py
│   │   ├── menu.py
│   │   └── order_history.py
│   ├── schemas/
│   │   ├── customer.py
│   │   └── admin.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── cache.py
│   │   ├── logger.py
│   │   └── errors.py
│   └── main.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── requirements.txt
```

---

### Unit 4: Database Schema

**유닛 ID**: `database-schema`

**책임**:
- 데이터베이스 스키마 정의
- 마이그레이션 스크립트 관리
- 초기 데이터 시딩
- 인덱스 및 제약조건 관리

**기술 스택**:
- PostgreSQL 14+
- Alembic (마이그레이션 도구)
- SQLAlchemy (ORM)

**엔티티**:
1. **Store** - 매장 정보
2. **Table** - 테이블 정보
3. **TableSession** - 테이블 세션
4. **Menu** - 메뉴 정보
5. **Category** - 카테고리 정보
6. **Order** - 주문 정보
7. **OrderItem** - 주문 항목
8. **OrderHistory** - 주문 이력

**주요 관계**:
- Store 1:N Table
- Store 1:N Menu
- Store 1:N Category
- Table 1:N TableSession
- TableSession 1:N Order
- Order 1:N OrderItem
- Menu 1:N OrderItem
- Category 1:N Menu

**디렉토리 구조**:
```
database/
├── migrations/
│   ├── versions/
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_indexes.py
│   │   └── ...
│   └── env.py
├── seeds/
│   ├── sample_store.sql
│   ├── sample_menus.sql
│   └── sample_tables.sql
└── schema/
    └── schema.sql (전체 스키마 정의)
```

---

## 모노레포 구조

```
table-order-service/
├── frontend/                    # Unit 1 & 2
│   ├── src/
│   │   ├── customer/           # Unit 1
│   │   ├── admin/              # Unit 2
│   │   ├── shared/             # 공통
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/                     # Unit 3
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── main.py
├── database/                    # Unit 4
│   ├── migrations/
│   ├── seeds/
│   └── schema/
├── aidlc-docs/                  # 문서
├── .env.example
├── docker-compose.yml (로컬 개발용)
└── README.md
```

---

## 개발 전략

### 병렬 개발 접근
- **Unit 1 (Customer Frontend)**: 독립적으로 개발, Mock API 사용
- **Unit 2 (Admin Frontend)**: 독립적으로 개발, Mock API 사용
- **Unit 3 (Backend API)**: 독립적으로 개발, 테스트 데이터베이스 사용
- **Unit 4 (Database Schema)**: 먼저 스키마 정의 후 마이그레이션 생성

### 지속적 통합
- 각 유닛 개발 중 정기적으로 통합 테스트 실행
- Backend API 완성 시 Frontend Mock을 실제 API로 교체
- 통합 테스트 자동화 (CI/CD)

### 로컬 개발 환경
- Docker Compose로 전체 스택 실행
  - PostgreSQL 컨테이너
  - Backend API 컨테이너
  - Frontend 개발 서버 (Vite)
- 환경 변수 관리 (.env 파일)
- 핫 리로드 지원

---

## 빌드 및 실행

### 로컬 개발 실행
```bash
# 데이터베이스 시작
docker-compose up -d postgres

# 백엔드 실행
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 프론트엔드 실행
cd frontend
npm install
npm run dev
```

### 테스트 실행
```bash
# 백엔드 테스트
cd backend
pytest

# 프론트엔드 테스트
cd frontend
npm test
```

---

## 유닛 간 계약

### Frontend → Backend API
- **프로토콜**: HTTP REST API
- **인증**: JWT Bearer Token
- **데이터 형식**: JSON
- **에러 형식**: `{"detail": "error message"}`

### Backend API → Database
- **프로토콜**: PostgreSQL 프로토콜
- **ORM**: SQLAlchemy
- **트랜잭션**: Repository 레이어에서 관리

### Admin Frontend → Backend (SSE)
- **프로토콜**: Server-Sent Events
- **엔드포인트**: `GET /admin/orders/sse`
- **이벤트 형식**: JSON
- **재연결**: 자동 재연결 + 지수 백오프
