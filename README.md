# 🍽️ Table Order Service

매장 내 테이블 주문 시스템 - AI DLC 방법론으로 개발된 프로덕션 레디 프로젝트

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [AIDLC 유닛 구조](#-aidlc-유닛-구조)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [설치 및 실행](#-설치-및-실행)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)
- [개발 가이드](#-개발-가이드)
- [배포](#-배포)

---

## 🎯 프로젝트 개요

레스토랑 및 카페에서 사용할 수 있는 테이블 주문 시스템입니다. 고객은 테이블에 비치된 태블릿으로 메뉴를 보고 주문하며, 관리자는 실시간으로 주문을 모니터링하고 관리할 수 있습니다.

### 주요 기능

**고객용 (Customer Frontend)**
- 🔐 테이블 자동 로그인
- 📱 메뉴 조회 및 탐색
- 🛒 장바구니 관리
- 📝 주문 생성 및 내역 조회

**관리자용 (Admin Frontend)**
- 🔑 관리자 로그인 (JWT 인증)
- 📊 실시간 주문 대시보드 (SSE)
- 🔄 주문 상태 관리
- 🪑 테이블 관리
- 🍔 메뉴 관리 (CRUD)

---

## 🏗️ AIDLC 유닛 구조

이 프로젝트는 **AI-Driven Development Life Cycle (AIDLC)** 방법론에 따라 4개의 독립적인 유닛으로 분해되어 개발되었습니다.

### Unit 1: Customer Frontend (고객용 프론트엔드)

**위치**: `customer-frontend/`

**책임**:
- 고객용 UI/UX 제공
- 메뉴 조회 및 주문 기능
- 장바구니 관리 (localStorage)

**기술 스택**:
- React 18 + TypeScript
- React Router, React Query
- Vite

**주요 기능**:
- US-001: 테이블 태블릿 자동 로그인
- US-002: 메뉴 조회
- US-003: 메뉴 상세 정보 확인
- US-004: 장바구니 추가
- US-005: 장바구니 수량 조정
- US-006: 주문 생성
- US-007: 주문 확인
- US-008: 주문 내역 조회

---

### Unit 2: Admin Frontend (관리자용 프론트엔드)

**위치**: `frontend/`

**책임**:
- 관리자용 UI/UX 제공
- 실시간 주문 모니터링 (SSE)
- 테이블 및 메뉴 관리

**기술 스택**:
- React 18 + JavaScript
- Material-UI (MUI)
- React Router, React Query
- EventSource (SSE)
- Vite

**주요 기능**:
- US-009: 관리자 로그인
- US-010: 실시간 주문 대시보드
- US-011: 주문 상세 정보 확인
- US-012: 주문 상태 변경
- US-013: SSE 실시간 업데이트
- US-014: 테이블 초기 설정
- US-015: 주문 삭제
- US-016: 테이블 세션 종료
- US-017: 과거 주문 내역 조회
- US-018~022: 메뉴 관리 (CRUD, 순서 조정)

---

### Unit 3: Backend API

**위치**: `backend/`

**책임**:
- RESTful API 제공
- 비즈니스 로직 처리
- 데이터베이스 액세스
- JWT 인증 및 인가
- 실시간 통신 (SSE)

**기술 스택**:
- FastAPI (Python 3.10+)
- SQLAlchemy (ORM)
- PostgreSQL
- JWT (python-jose)
- bcrypt (비밀번호 해싱)

**아키텍처**: 4-Layer Architecture
1. API Layer (Routers)
2. Service Layer
3. Repository Layer
4. Model Layer (SQLAlchemy)

---

### Unit 4: Database Schema

**위치**: `database/`

**책임**:
- 데이터베이스 스키마 정의
- 마이그레이션 관리
- 초기 데이터 시딩

**기술 스택**:
- PostgreSQL 14+
- Alembic (마이그레이션)

**엔티티**:
- Store (매장)
- Table (테이블)
- TableSession (세션)
- Menu (메뉴)
- Category (카테고리)
- Order (주문)
- OrderItem (주문 항목)
- OrderHistory (주문 이력)

---

## 🛠️ 기술 스택

### Frontend
- **Customer**: React 18 + TypeScript + Vite
- **Admin**: React 18 + JavaScript + MUI + Vite
- **상태 관리**: React Query + Context API
- **HTTP**: Axios
- **실시간**: EventSource (SSE)

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **인증**: JWT (python-jose)
- **비동기**: asyncio

### DevOps
- **컨테이너**: Docker, Docker Compose
- **버전 관리**: Git
- **문서**: Markdown

---

## 🚀 빠른 시작

### 방법 1: 자동 실행 스크립트

**Windows**:
```bash
start-dev.bat
```

**Mac/Linux**:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### 방법 2: Docker Compose (권장)

```bash
# 전체 스택 실행
docker-compose up -d

# 접속
# - Customer Frontend: http://localhost:5173
# - Admin Frontend: http://localhost:5174
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

---

## 📦 설치 및 실행

### 사전 요구사항

- **Node.js**: 18.x 이상
- **Python**: 3.10 이상
- **PostgreSQL**: 14 이상
- **npm** 또는 **yarn**
- **pip**

### 1️⃣ 데이터베이스 설정

```bash
# PostgreSQL 설치 및 실행
# 또는 Docker로 실행
docker run -d \
  --name postgres \
  -e POSTGRES_USER=tableorder \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=tableorder \
  -p 5432:5432 \
  postgres:14
```

### 2️⃣ Backend 설정 및 실행

```bash
cd backend

# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (DATABASE_URL, JWT_SECRET_KEY 등)

# 데이터베이스 마이그레이션
alembic upgrade head

# 서버 실행
python run.py
# 또는
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**접속**: 
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3️⃣ Customer Frontend 설정 및 실행

```bash
cd customer-frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 개발 서버 실행
npm run dev
```

**접속**: http://localhost:5173

**테스트 계정**:
- Store ID: `store-1`
- Table: `1`
- Password: `password`

### 4️⃣ Admin Frontend 설정 및 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집

# 개발 서버 실행
npm run dev
```

**접속**: http://localhost:5174 (또는 5173)

**테스트 계정**:
- Store ID: `store-1`
- Username: `admin`
- Password: `admin123`

---

## 📁 프로젝트 구조

```
aidlc-0204/
├── customer-frontend/          # Unit 1: 고객용 프론트엔드
│   ├── src/
│   │   ├── api/               # API 서비스
│   │   ├── components/        # React 컴포넌트
│   │   ├── contexts/          # Context Providers
│   │   ├── hooks/             # 커스텀 훅
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── services/          # 비즈니스 로직
│   │   ├── types/             # TypeScript 타입
│   │   └── utils/             # 유틸리티
│   ├── package.json
│   └── vite.config.ts
│
├── frontend/                   # Unit 2: 관리자용 프론트엔드
│   ├── src/
│   │   ├── admin/
│   │   │   ├── components/   # 관리자 컴포넌트
│   │   │   ├── contexts/     # Context
│   │   │   └── hooks/        # 커스텀 훅 (SSE)
│   │   ├── api/              # API 클라이언트
│   │   ├── config/           # 설정
│   │   └── utils/            # 유틸리티
│   ├── package.json
│   └── vite.config.js
│
├── backend/                    # Unit 3: Backend API
│   ├── app/
│   │   ├── api/              # API 라우터
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   ├── core/             # 핵심 설정
│   │   ├── models/           # SQLAlchemy 모델
│   │   ├── repositories/     # Repository 레이어
│   │   ├── schemas/          # Pydantic 스키마
│   │   ├── services/         # Service 레이어
│   │   ├── middleware/       # 미들웨어
│   │   └── main.py           # FastAPI 앱
│   ├── requirements.txt
│   └── run.py
│
├── database/                   # Unit 4: Database Schema
│   ├── migrations/           # Alembic 마이그레이션
│   ├── schema/               # SQL 스키마
│   └── seeds/                # 초기 데이터
│
├── aidlc-docs/                # AIDLC 개발 문서
│   ├── inception/            # 요구사항 분석
│   └── construction/         # 설계 및 구현
│
├── docker-compose.yml         # Docker Compose 설정
├── .gitignore
└── README.md                  # 이 파일
```

---

## 📚 API 문서

### Customer API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/auth/table/login` | 테이블 로그인 |
| GET | `/api/v1/customer/menus` | 메뉴 조회 |
| POST | `/api/v1/customer/orders` | 주문 생성 |
| GET | `/api/v1/customer/orders` | 주문 내역 조회 |

### Admin API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/auth/admin/login` | 관리자 로그인 |
| GET | `/api/v1/admin/orders` | 주문 목록 조회 |
| GET | `/api/v1/admin/orders/sse` | 실시간 주문 업데이트 (SSE) |
| PATCH | `/api/v1/admin/orders/{id}/status` | 주문 상태 변경 |
| DELETE | `/api/v1/admin/orders/{id}` | 주문 삭제 |
| POST | `/api/v1/admin/tables` | 테이블 생성 |
| POST | `/api/v1/admin/tables/{id}/end-session` | 세션 종료 |
| GET | `/api/v1/admin/tables/{id}/history` | 과거 주문 내역 |
| GET | `/api/v1/admin/menus` | 메뉴 목록 |
| POST | `/api/v1/admin/menus` | 메뉴 생성 |
| PATCH | `/api/v1/admin/menus/{id}` | 메뉴 수정 |
| DELETE | `/api/v1/admin/menus/{id}` | 메뉴 삭제 |

**상세 문서**: http://localhost:8000/docs (Swagger UI)

---

## 🔧 개발 가이드

### 환경 변수 설정

#### Backend (.env)
```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true
ENVIRONMENT=development

# Database
DATABASE_URL=postgresql+asyncpg://tableorder:password@localhost:5432/tableorder

# JWT
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=16

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Cache
CACHE_TTL=300
```

#### Customer Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false
```

#### Admin Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SSE_RECONNECT_INTERVAL=3000
```

### Mock 모드 (Backend 없이 개발)

**Customer Frontend**:
```bash
cd customer-frontend
cp .env.mock .env
npm run dev
```

**Admin Frontend**:
```bash
cd frontend
# AdminContext.jsx에서 Mock 데이터 사용
npm run dev
```

### 테스트 실행

**Backend**:
```bash
cd backend
pytest                    # 전체 테스트
pytest -v                 # 상세 출력
pytest --cov              # 커버리지
pytest tests/unit/        # 단위 테스트만
```

**Frontend**:
```bash
cd customer-frontend
npm test                  # 단위 테스트
npm run test:ui           # UI 테스트
npm run test:coverage     # 커버리지
```

### 코드 스타일

**Backend**:
```bash
# Linting
flake8 app/
pylint app/

# Formatting
black app/
isort app/
```

**Frontend**:
```bash
# Linting
npm run lint

# Formatting
npm run format
```

---

## 🚢 배포

### 프로덕션 빌드

**Customer Frontend**:
```bash
cd customer-frontend
npm run build
# dist/ 폴더에 빌드 결과 생성
```

**Admin Frontend**:
```bash
cd frontend
npm run build
# dist/ 폴더에 빌드 결과 생성
```

**Backend**:
```bash
cd backend
# 프로덕션 환경 변수 설정
export ENVIRONMENT=production
export DEBUG=false

# Gunicorn으로 실행
gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Docker 배포

```bash
# 이미지 빌드
docker-compose build

# 프로덕션 실행
docker-compose -f docker-compose.prod.yml up -d
```

### 보안 체크리스트

프로덕션 배포 전 확인사항:

- [ ] JWT_SECRET_KEY 변경
- [ ] DEBUG=false 설정
- [ ] CORS_ORIGINS 제한
- [ ] HTTPS 사용
- [ ] 환경 변수 암호화
- [ ] 데이터베이스 백업 설정
- [ ] 로그 모니터링 설정
- [ ] Rate Limiting 설정

---

## 📖 추가 문서

- [빠른 시작 가이드](QUICK_START.md)
- [프로젝트 구조](PROJECT_STRUCTURE.md)
- [통합 가이드](INTEGRATION_GUIDE.md)
- [Customer Frontend README](customer-frontend/README.md)
- [Admin Frontend README](frontend/README.md)
- [AIDLC 문서](aidlc-docs/)

---

## 🤝 기여

이 프로젝트는 AIDLC 방법론에 따라 개발되었습니다. 기여하시려면:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 👥 개발팀

- **Unit 1 (Customer Frontend)**: Customer Frontend Team
- **Unit 2 (Admin Frontend)**: Admin Frontend Team
- **Unit 3 (Backend API)**: Backend Team
- **Unit 4 (Database Schema)**: Database Team

---

## 📞 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.

---

**개발 방법론**: AI-Driven Development Life Cycle (AIDLC)  
**개발 기간**: 2026-02  
**버전**: 1.0.0
