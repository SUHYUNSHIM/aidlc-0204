# Phase 1-1: 프로젝트 구조 생성

## 목표

FastAPI 백엔드 프로젝트의 디렉토리 구조 및 기본 파일 생성

---

## 디렉토리 구조

```
app/
├── __init__.py
├── main.py                     # FastAPI 애플리케이션 진입점
├── core/
│   ├── __init__.py
│   ├── config.py               # 환경 설정
│   ├── database.py             # DB 연결 및 세션
│   ├── security.py             # JWT, bcrypt
│   ├── cache.py                # 인메모리 캐시
│   ├── dependencies.py         # 의존성 주입
│   └── exceptions.py           # 커스텀 예외
├── models/
│   ├── __init__.py
│   ├── store.py
│   ├── category.py
│   ├── menu.py
│   ├── table.py
│   ├── table_session.py
│   ├── order.py
│   ├── order_item.py
│   └── order_history.py
├── schemas/
│   ├── __init__.py
│   ├── auth.py
│   ├── menu.py
│   ├── order.py
│   ├── table.py
│   └── common.py
├── repositories/
│   ├── __init__.py
│   ├── store_repository.py
│   ├── category_repository.py
│   ├── menu_repository.py
│   ├── table_repository.py
│   ├── session_repository.py
│   ├── order_repository.py
│   └── history_repository.py
├── services/
│   ├── __init__.py
│   ├── auth_service.py
│   ├── menu_service.py
│   ├── order_service.py
│   ├── table_service.py
│   └── sse_service.py
└── api/
    ├── __init__.py
    └── v1/
        ├── __init__.py
        ├── router.py           # 라우터 통합
        └── endpoints/
            ├── __init__.py
            ├── auth.py
            ├── customer.py
            ├── admin.py
            └── health.py
```

---

## 생성할 파일 목록

### 1. 루트 파일

| 파일 | 설명 |
|-----|-----|
| `app/__init__.py` | 패키지 초기화 |
| `app/main.py` | FastAPI 앱 생성 및 설정 |

### 2. core/ 모듈

| 파일 | 설명 |
|-----|-----|
| `core/__init__.py` | 패키지 초기화 |
| `core/config.py` | Pydantic Settings 기반 설정 |
| `core/database.py` | SQLAlchemy 엔진 및 세션 |
| `core/security.py` | JWT 토큰 및 비밀번호 해싱 |
| `core/cache.py` | 인메모리 캐시 매니저 |
| `core/dependencies.py` | FastAPI 의존성 함수 |
| `core/exceptions.py` | 커스텀 예외 클래스 |

### 3. models/ 모듈

| 파일 | 설명 |
|-----|-----|
| `models/__init__.py` | 모델 export |
| `models/store.py` | Store 모델 |
| `models/category.py` | Category 모델 |
| `models/menu.py` | Menu 모델 |
| `models/table.py` | Table 모델 |
| `models/table_session.py` | TableSession 모델 |
| `models/order.py` | Order 모델 |
| `models/order_item.py` | OrderItem 모델 |
| `models/order_history.py` | OrderHistory 모델 |

### 4. schemas/ 모듈

| 파일 | 설명 |
|-----|-----|
| `schemas/__init__.py` | 스키마 export |
| `schemas/auth.py` | 인증 관련 스키마 |
| `schemas/menu.py` | 메뉴/카테고리 스키마 |
| `schemas/order.py` | 주문 관련 스키마 |
| `schemas/table.py` | 테이블/세션 스키마 |
| `schemas/common.py` | 공통 응답 스키마 |

### 5. repositories/ 모듈

| 파일 | 설명 |
|-----|-----|
| `repositories/__init__.py` | Repository export |
| `repositories/store_repository.py` | Store CRUD |
| `repositories/category_repository.py` | Category CRUD |
| `repositories/menu_repository.py` | Menu CRUD |
| `repositories/table_repository.py` | Table CRUD |
| `repositories/session_repository.py` | TableSession CRUD |
| `repositories/order_repository.py` | Order CRUD |
| `repositories/history_repository.py` | OrderHistory CRUD |

### 6. services/ 모듈

| 파일 | 설명 |
|-----|-----|
| `services/__init__.py` | Service export |
| `services/auth_service.py` | 인증 비즈니스 로직 |
| `services/menu_service.py` | 메뉴 비즈니스 로직 |
| `services/order_service.py` | 주문 비즈니스 로직 |
| `services/table_service.py` | 테이블 비즈니스 로직 |
| `services/sse_service.py` | SSE 연결 관리 |

### 7. api/ 모듈

| 파일 | 설명 |
|-----|-----|
| `api/__init__.py` | 패키지 초기화 |
| `api/v1/__init__.py` | v1 패키지 초기화 |
| `api/v1/router.py` | 라우터 통합 |
| `api/v1/endpoints/auth.py` | 인증 엔드포인트 |
| `api/v1/endpoints/customer.py` | 고객용 엔드포인트 |
| `api/v1/endpoints/admin.py` | 관리자용 엔드포인트 |
| `api/v1/endpoints/health.py` | 헬스 체크 |

---

## 루트 설정 파일

### requirements.txt

```
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0

# Database
sqlalchemy==2.0.25
asyncpg==0.29.0
psycopg2-binary==2.9.9

# Authentication
python-jose[cryptography]==3.3.0
bcrypt==4.1.2

# Validation
pydantic==2.5.3
pydantic-settings==2.1.0

# Utilities
python-multipart==0.0.6
python-dotenv==1.0.0

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
```

### .env.example

```env
# Database
DATABASE_URL=postgresql+asyncpg://tableorder:tableorder_dev_pw@localhost:5432/tableorder_db

# Security
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=16

# Server
DEBUG=true
LOG_LEVEL=DEBUG

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# SSE
SSE_HEARTBEAT_INTERVAL=30
```

### .gitignore

```
# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# Testing
.pytest_cache/
.coverage
htmlcov/

# Logs
*.log
```

---

## 체크리스트

- [ ] 디렉토리 구조 생성
- [ ] `__init__.py` 파일 생성
- [ ] requirements.txt 생성
- [ ] .env.example 생성
- [ ] .gitignore 생성
