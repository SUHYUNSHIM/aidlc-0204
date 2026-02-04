# Phase 5-1: 메인 애플리케이션

## 목표

FastAPI 애플리케이션 통합 및 진입점 구현

---

## 1. app/main.py

```python
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.middleware import (
    RequestLoggingMiddleware,
    get_cors_middleware_config,
    app_exception_handler,
    authentication_error_handler,
    authorization_error_handler,
    not_found_error_handler,
    validation_error_handler,
    business_logic_error_handler,
    generic_exception_handler,
)
from app.core.exceptions import (
    AppException,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    BusinessLogicError,
)

# 로깅 설정
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # Startup
    logger.info(
        "Application starting",
        extra={
            "app_name": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
        }
    )
    
    # DB 테이블 생성 (개발 환경에서만)
    if settings.DEBUG:
        async with engine.begin() as conn:
            # 주의: 프로덕션에서는 Alembic 마이그레이션 사용
            # await conn.run_sync(Base.metadata.create_all)
            pass
    
    yield
    
    # Shutdown
    logger.info("Application shutting down")
    await engine.dispose()


def create_application() -> FastAPI:
    """FastAPI 애플리케이션 팩토리"""
    
    app = FastAPI(
        title=settings.APP_NAME,
        description="테이블 오더 서비스 백엔드 API",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )
    
    # CORS 미들웨어
    app.add_middleware(CORSMiddleware, **get_cors_middleware_config())
    
    # 요청 로깅 미들웨어
    app.add_middleware(RequestLoggingMiddleware)
    
    # 예외 핸들러 등록
    app.add_exception_handler(AuthenticationError, authentication_error_handler)
    app.add_exception_handler(AuthorizationError, authorization_error_handler)
    app.add_exception_handler(NotFoundError, not_found_error_handler)
    app.add_exception_handler(ValidationError, validation_error_handler)
    app.add_exception_handler(BusinessLogicError, business_logic_error_handler)
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
    
    # API 라우터 등록
    app.include_router(api_router, prefix="/api/v1")
    
    return app


# 애플리케이션 인스턴스
app = create_application()


# 루트 엔드포인트
@app.get("/")
async def root():
    """API 루트"""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None,
    }
```

---

## 2. app/core/logging.py

```python
import logging
import sys
import json
from datetime import datetime
from typing import Any


class JSONFormatter(logging.Formatter):
    """JSON 형식 로그 포매터"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # extra 필드 추가
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "method"):
            log_data["method"] = record.method
        if hasattr(record, "path"):
            log_data["path"] = record.path
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        if hasattr(record, "process_time_ms"):
            log_data["process_time_ms"] = record.process_time_ms
        if hasattr(record, "error_code"):
            log_data["error_code"] = record.error_code
        if hasattr(record, "client_ip"):
            log_data["client_ip"] = record.client_ip
        
        # 예외 정보
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)


class ConsoleFormatter(logging.Formatter):
    """콘솔용 컬러 포매터"""
    
    COLORS = {
        "DEBUG": "\033[36m",    # Cyan
        "INFO": "\033[32m",     # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",    # Red
        "CRITICAL": "\033[35m", # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # 기본 메시지
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = f"{color}[{timestamp}] {record.levelname:8}{self.RESET} {record.name}: {record.getMessage()}"
        
        # request_id가 있으면 추가
        if hasattr(record, "request_id"):
            message = f"{color}[{timestamp}] {record.levelname:8}{self.RESET} [{record.request_id}] {record.name}: {record.getMessage()}"
        
        return message


def setup_logging():
    """로깅 설정"""
    from app.core.config import settings
    
    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # 기존 핸들러 제거
    root_logger.handlers.clear()
    
    # 콘솔 핸들러
    console_handler = logging.StreamHandler(sys.stdout)
    
    if settings.DEBUG:
        # 개발 환경: 컬러 포매터
        console_handler.setFormatter(ConsoleFormatter())
    else:
        # 프로덕션: JSON 포매터
        console_handler.setFormatter(JSONFormatter())
    
    root_logger.addHandler(console_handler)
    
    # SQLAlchemy 로깅 레벨 조정
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
    
    # Uvicorn 로깅 레벨 조정
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
```

---

## 3. run.py (개발용 실행 스크립트)

```python
#!/usr/bin/env python
"""개발 서버 실행 스크립트"""
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
```

---

## 4. 환경별 실행 방법

### 개발 환경

```bash
# 방법 1: run.py 사용
python run.py

# 방법 2: uvicorn 직접 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 프로덕션 환경

```bash
# Gunicorn + Uvicorn workers
gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile -
```

### Docker 환경

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

---

## 5. requirements.txt

```text
# Core
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
gunicorn>=21.2.0

# Database
sqlalchemy[asyncio]>=2.0.25
asyncpg>=0.29.0
alembic>=1.13.0

# Validation
pydantic>=2.5.0
pydantic-settings>=2.1.0

# Security
python-jose[cryptography]>=3.3.0
bcrypt>=4.1.0

# Utilities
python-dotenv>=1.0.0
```

---

## 체크리스트

- [ ] app/main.py 구현
- [ ] app/core/logging.py 구현
- [ ] run.py 작성
- [ ] requirements.txt 작성
- [ ] Dockerfile 작성 (선택)
- [ ] docker-compose.yml 작성 (선택)
