# 설정 및 환경 변수

## 1. 환경 변수 정의

### .env 파일 구조

```env
# ===========================================
# 데이터베이스 설정
# ===========================================
DATABASE_URL=postgresql://table_order_user:secure_password@localhost:5432/table_order_db
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30

# ===========================================
# JWT 인증 설정
# ===========================================
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=16

# ===========================================
# 서버 설정
# ===========================================
HOST=0.0.0.0
PORT=8000
DEBUG=true
LOG_LEVEL=INFO

# ===========================================
# CORS 설정
# ===========================================
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true

# ===========================================
# 캐시 설정
# ===========================================
CACHE_TYPE=memory
CACHE_DEFAULT_TTL=3600
MENU_CACHE_TTL=3600

# ===========================================
# SSE 설정
# ===========================================
SSE_HEARTBEAT_INTERVAL=30
SSE_RETRY_TIMEOUT=3000
```

---

## 2. 설정 클래스

```python
# app/core/config.py

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache

class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 데이터베이스
    database_url: str
    database_pool_size: int = 5
    database_max_overflow: int = 10
    database_pool_timeout: int = 30
    
    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 16
    
    # 서버
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    log_level: str = "INFO"
    
    # CORS
    cors_origins: str = "http://localhost:5173"
    cors_allow_credentials: bool = True
    
    # 캐시
    cache_type: str = "memory"
    cache_default_ttl: int = 3600
    menu_cache_ttl: int = 3600
    
    # SSE
    sse_heartbeat_interval: int = 30
    sse_retry_timeout: int = 3000
    
    @property
    def cors_origins_list(self) -> List[str]:
        """CORS origins를 리스트로 변환"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """설정 싱글톤 (캐싱)"""
    return Settings()
```

---

## 3. 데이터베이스 설정

```python
# app/core/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings

settings = get_settings()

# SQLAlchemy 엔진 생성
engine = create_engine(
    settings.database_url,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_timeout=settings.database_pool_timeout,
    pool_pre_ping=True,  # 연결 상태 확인
    echo=settings.debug  # SQL 로깅 (디버그 모드)
)

# 세션 팩토리
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base 클래스
Base = declarative_base()

def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """데이터베이스 초기화 (테이블 생성)"""
    Base.metadata.create_all(bind=engine)
```

---

## 4. 로깅 설정

```python
# app/core/logger.py

import logging
import sys
from .config import get_settings

settings = get_settings()

def setup_logging():
    """로깅 설정"""
    
    # 로그 포맷
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # 로그 레벨 매핑
    level_map = {
        "DEBUG": logging.DEBUG,
        "INFO": logging.INFO,
        "WARNING": logging.WARNING,
        "ERROR": logging.ERROR,
        "CRITICAL": logging.CRITICAL
    }
    
    log_level = level_map.get(settings.log_level.upper(), logging.INFO)
    
    # 루트 로거 설정
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # SQLAlchemy 로거 레벨 조정
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.DEBUG if settings.debug else logging.WARNING
    )
    
    # uvicorn 로거 레벨 조정
    logging.getLogger("uvicorn").setLevel(log_level)
    
    return logging.getLogger(__name__)

# 애플리케이션 로거
logger = setup_logging()
```

---

## 5. 캐시 설정

```python
# app/core/cache.py

from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import threading
from .config import get_settings

settings = get_settings()

class InMemoryCacheManager:
    """인메모리 캐시 관리자"""
    
    def __init__(self):
        self._cache: Dict[str, dict] = {}
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 조회"""
        with self._lock:
            if key not in self._cache:
                return None
            
            entry = self._cache[key]
            if datetime.utcnow() > entry["expires_at"]:
                # 만료된 항목 삭제
                del self._cache[key]
                return None
            
            return entry["value"]
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """캐시에 값 저장"""
        if ttl is None:
            ttl = settings.cache_default_ttl
        
        with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl)
            }
        return True
    
    def delete(self, key: str) -> bool:
        """캐시에서 값 삭제"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """패턴에 맞는 모든 캐시 무효화"""
        # 간단한 와일드카드 지원 (예: "menu:*")
        prefix = pattern.rstrip("*")
        count = 0
        
        with self._lock:
            keys_to_delete = [
                key for key in self._cache.keys()
                if key.startswith(prefix)
            ]
            for key in keys_to_delete:
                del self._cache[key]
                count += 1
        
        return count
    
    def clear(self) -> bool:
        """전체 캐시 초기화"""
        with self._lock:
            self._cache.clear()
        return True
    
    def cleanup_expired(self):
        """만료된 항목 정리"""
        now = datetime.utcnow()
        with self._lock:
            keys_to_delete = [
                key for key, entry in self._cache.items()
                if now > entry["expires_at"]
            ]
            for key in keys_to_delete:
                del self._cache[key]

# 싱글톤 인스턴스
_cache_manager: Optional[InMemoryCacheManager] = None

def get_cache_manager() -> InMemoryCacheManager:
    """캐시 매니저 싱글톤"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = InMemoryCacheManager()
    return _cache_manager
```

---

## 6. 에러 핸들러 설정

```python
# app/core/errors.py

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)

# 커스텀 예외 클래스
class AppException(Exception):
    """기본 애플리케이션 예외"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class NotFoundException(AppException):
    """리소스를 찾을 수 없음 (404)"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404)

class ValidationError(AppException):
    """유효성 검증 실패 (400)"""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, 400)

class AuthenticationError(AppException):
    """인증 실패 (401)"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401)

class ForbiddenError(AppException):
    """권한 없음 (403)"""
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message, 403)

class ConflictError(AppException):
    """충돌 (409)"""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, 409)

# 에러 핸들러 함수
async def app_exception_handler(request: Request, exc: AppException):
    """애플리케이션 예외 핸들러"""
    logger.warning(f"AppException: {exc.message} (status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Pydantic 검증 예외 핸들러"""
    errors = exc.errors()
    error_messages = []
    for error in errors:
        field = ".".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_messages.append(f"{field}: {message}")
    
    detail = "; ".join(error_messages)
    logger.warning(f"ValidationError: {detail}")
    
    return JSONResponse(
        status_code=400,
        content={"detail": detail}
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 예외 핸들러"""
    logger.warning(f"HTTPException: {exc.detail} (status: {exc.status_code})")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """일반 예외 핸들러"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

def register_exception_handlers(app):
    """예외 핸들러 등록"""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
```

---

## 7. 메인 애플리케이션 설정

```python
# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import get_settings
from .core.database import init_db
from .core.logger import setup_logging, logger
from .core.errors import register_exception_handlers
from .api.routers import customer, admin

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 라이프사이클"""
    # 시작 시
    logger.info("Starting application...")
    init_db()
    logger.info("Database initialized")
    
    yield
    
    # 종료 시
    logger.info("Shutting down application...")

def create_app() -> FastAPI:
    """FastAPI 애플리케이션 생성"""
    
    app = FastAPI(
        title="Table Order Service API",
        description="테이블 오더 서비스 백엔드 API",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan
    )
    
    # CORS 미들웨어
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 예외 핸들러 등록
    register_exception_handlers(app)
    
    # 라우터 등록
    app.include_router(customer.router, prefix="/customer", tags=["Customer"])
    app.include_router(admin.router, prefix="/admin", tags=["Admin"])
    
    # 헬스 체크
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
```

---

## 8. Docker Compose 설정

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: table_order_db
    environment:
      POSTGRES_USER: table_order_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: table_order_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U table_order_user -d table_order_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: table_order_api
    environment:
      DATABASE_URL: postgresql://table_order_user:secure_password@postgres:5432/table_order_db
      JWT_SECRET_KEY: ${JWT_SECRET_KEY:-dev-secret-key}
      DEBUG: "true"
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:
```

---

## 9. requirements.txt

```
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0

# Database
sqlalchemy==2.0.25
alembic==1.13.0
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

# Development
black==23.12.1
isort==5.13.2
flake8==7.0.0
```
