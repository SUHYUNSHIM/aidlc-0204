# 운영성 설계 (Operability Design)

## 개요

테이블 오더 서비스의 운영, 모니터링, 로깅 설계입니다.

---

## 1. 로깅 전략

### 1.1 구조화된 로깅 설정

```python
# app/core/logging.py
import logging
import sys
from typing import Optional
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON 형식 로그 포매터"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # 추가 컨텍스트 정보
        if hasattr(record, 'store_id'):
            log_data['store_id'] = record.store_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
            
        # 예외 정보
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(log_level: str = "INFO") -> None:
    """로깅 설정 초기화"""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # 콘솔 핸들러
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(console_handler)
    
    # SQLAlchemy 로그 레벨 조정
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
```

### 1.2 요청별 로깅 미들웨어

```python
# app/middleware/logging_middleware.py
import uuid
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """요청/응답 로깅 미들웨어"""
    
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        
        # 요청 정보 로깅
        logger.info(
            f"Request started",
            extra={
                'request_id': request_id,
                'method': request.method,
                'path': request.url.path,
                'client_ip': request.client.host if request.client else None,
            }
        )
        
        # 요청 처리
        response = await call_next(request)
        
        # 응답 정보 로깅
        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            f"Request completed",
            extra={
                'request_id': request_id,
                'status_code': response.status_code,
                'duration_ms': round(duration_ms, 2),
            }
        )
        
        # 응답 헤더에 request_id 추가
        response.headers['X-Request-ID'] = request_id
        
        return response
```

### 1.3 로그 레벨 가이드

| 레벨 | 용도 | 예시 |
|-----|-----|-----|
| ERROR | 즉시 대응 필요한 오류 | DB 연결 실패, 인증 오류 |
| WARNING | 주의가 필요한 상황 | 느린 쿼리, 재시도 발생 |
| INFO | 주요 비즈니스 이벤트 | 주문 생성, 상태 변경 |
| DEBUG | 개발/디버깅용 상세 정보 | 쿼리 파라미터, 중간 결과 |

---

## 2. 헬스 체크

### 2.1 헬스 체크 엔드포인트

```python
# app/api/v1/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """기본 헬스 체크 - 애플리케이션 상태"""
    return {"status": "healthy"}


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """준비 상태 체크 - DB 연결 포함"""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "checks": {
                "database": "connected"
            }
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "checks": {
                "database": f"error: {str(e)}"
            }
        }


@router.get("/health/live")
async def liveness_check():
    """생존 상태 체크 - 프로세스 상태"""
    return {"status": "alive"}
```

### 2.2 헬스 체크 용도

| 엔드포인트 | 용도 | 체크 주기 |
|-----------|-----|----------|
| /health | 기본 상태 확인 | 10초 |
| /health/ready | 트래픽 수신 가능 여부 (K8s readiness) | 5초 |
| /health/live | 프로세스 생존 여부 (K8s liveness) | 10초 |

---

## 3. 모니터링 포인트

### 3.1 핵심 메트릭

```python
# app/core/metrics.py
from dataclasses import dataclass, field
from typing import Dict
from datetime import datetime
import asyncio

@dataclass
class ApplicationMetrics:
    """애플리케이션 메트릭 수집"""
    
    # 요청 메트릭
    total_requests: int = 0
    requests_by_endpoint: Dict[str, int] = field(default_factory=dict)
    requests_by_status: Dict[int, int] = field(default_factory=dict)
    
    # 응답 시간 메트릭
    response_times: list = field(default_factory=list)
    
    # SSE 메트릭
    active_sse_connections: int = 0
    total_sse_events_sent: int = 0
    
    # 비즈니스 메트릭
    orders_created: int = 0
    orders_by_status: Dict[str, int] = field(default_factory=dict)
    
    def record_request(self, endpoint: str, status_code: int, duration_ms: float):
        self.total_requests += 1
        self.requests_by_endpoint[endpoint] = self.requests_by_endpoint.get(endpoint, 0) + 1
        self.requests_by_status[status_code] = self.requests_by_status.get(status_code, 0) + 1
        self.response_times.append(duration_ms)
        
        # 최근 1000개만 유지
        if len(self.response_times) > 1000:
            self.response_times = self.response_times[-1000:]


# 전역 메트릭 인스턴스
metrics = ApplicationMetrics()
```

### 3.2 메트릭 엔드포인트

```python
# app/api/v1/metrics.py
from fastapi import APIRouter, Depends
from app.core.metrics import metrics
from app.core.dependencies import get_current_admin

router = APIRouter(tags=["Metrics"])

@router.get("/metrics", dependencies=[Depends(get_current_admin)])
async def get_metrics():
    """애플리케이션 메트릭 조회 (관리자 전용)"""
    avg_response_time = (
        sum(metrics.response_times) / len(metrics.response_times)
        if metrics.response_times else 0
    )
    
    return {
        "requests": {
            "total": metrics.total_requests,
            "by_endpoint": metrics.requests_by_endpoint,
            "by_status": metrics.requests_by_status,
        },
        "performance": {
            "avg_response_time_ms": round(avg_response_time, 2),
            "p95_response_time_ms": calculate_percentile(metrics.response_times, 95),
            "p99_response_time_ms": calculate_percentile(metrics.response_times, 99),
        },
        "sse": {
            "active_connections": metrics.active_sse_connections,
            "total_events_sent": metrics.total_sse_events_sent,
        },
        "business": {
            "orders_created": metrics.orders_created,
            "orders_by_status": metrics.orders_by_status,
        }
    }


def calculate_percentile(data: list, percentile: int) -> float:
    if not data:
        return 0
    sorted_data = sorted(data)
    index = int(len(sorted_data) * percentile / 100)
    return round(sorted_data[min(index, len(sorted_data) - 1)], 2)
```

### 3.3 모니터링 대시보드 지표

| 카테고리 | 지표 | 임계값 |
|---------|-----|-------|
| 성능 | 평균 응답 시간 | < 500ms |
| 성능 | P95 응답 시간 | < 1000ms |
| 성능 | P99 응답 시간 | < 2000ms |
| 가용성 | 에러율 (5xx) | < 1% |
| SSE | 활성 연결 수 | 모니터링 |
| SSE | 이벤트 전송 실패율 | < 0.1% |
| 비즈니스 | 시간당 주문 수 | 모니터링 |

---

## 4. 환경 설정 관리

### 4.1 환경 변수 구조

```python
# app/core/config.py
from pydantic import BaseSettings, validator
from typing import List, Optional

class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 애플리케이션
    APP_NAME: str = "Table Order Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # 데이터베이스
    DATABASE_URL: str
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # 보안
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_HOURS: int = 16
    
    # CORS
    CORS_ORIGINS: List[str] = []
    
    # SSE
    SSE_HEARTBEAT_INTERVAL: int = 30
    SSE_MAX_CONNECTIONS_PER_STORE: int = 100
    
    @validator('DATABASE_URL')
    def validate_database_url(cls, v):
        if not v.startswith(('postgresql://', 'postgresql+asyncpg://')):
            raise ValueError('DATABASE_URL must be a PostgreSQL connection string')
        return v
    
    @validator('CORS_ORIGINS', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 설정 인스턴스
settings = Settings()
```

### 4.2 환경별 설정 파일

```bash
# .env.example (템플릿)
# Application
APP_NAME=Table Order Service
DEBUG=false
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/tableorder
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_HOURS=16

# CORS
CORS_ORIGINS=http://localhost:3000

# SSE
SSE_HEARTBEAT_INTERVAL=30
SSE_MAX_CONNECTIONS_PER_STORE=100
```

### 4.3 환경별 설정 차이

| 설정 | 개발 | 스테이징 | 프로덕션 |
|-----|-----|---------|---------|
| DEBUG | true | false | false |
| LOG_LEVEL | DEBUG | INFO | INFO |
| DB_POOL_SIZE | 5 | 10 | 20 |
| DB_MAX_OVERFLOW | 5 | 10 | 20 |
| SSE_MAX_CONNECTIONS | 10 | 50 | 100 |

---

## 5. 에러 추적

### 5.1 에러 로깅 강화

```python
# app/middleware/error_handler.py
import logging
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """전역 에러 핸들링 미들웨어"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            # 상세 에러 로깅
            logger.error(
                f"Unhandled exception: {str(e)}",
                extra={
                    'path': request.url.path,
                    'method': request.method,
                    'traceback': traceback.format_exc(),
                },
                exc_info=True
            )
            
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "내부 서버 오류가 발생했습니다",
                    "error_code": "INTERNAL_ERROR"
                }
            )
```

---

## 6. 운영 체크리스트

| 항목 | 구현 | 우선순위 |
|-----|-----|---------|
| 구조화된 JSON 로깅 | ✅ | P0 |
| 요청별 로깅 (request_id) | ✅ | P0 |
| 헬스 체크 엔드포인트 | ✅ | P0 |
| 환경 변수 기반 설정 | ✅ | P0 |
| 메트릭 수집 | ✅ | P1 |
| 에러 추적 | ✅ | P1 |
| 외부 모니터링 연동 | ⏳ (향후) | P2 |
| 분산 추적 (Tracing) | ⏳ (향후) | P2 |
