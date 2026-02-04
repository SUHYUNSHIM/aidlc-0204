# Phase 4-2: 미들웨어 및 에러 핸들러

## 목표

요청/응답 처리 미들웨어 및 전역 에러 핸들러 구현

---

## 1. app/middleware/logging.py

```python
import time
import uuid
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """요청/응답 로깅 미들웨어"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # 요청 ID 생성
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        # 시작 시간
        start_time = time.time()
        
        # 요청 로깅
        logger.info(
            "Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": request.client.host if request.client else "unknown",
            }
        )
        
        # 요청 처리
        response = await call_next(request)
        
        # 처리 시간 계산
        process_time = time.time() - start_time
        
        # 응답 로깅
        logger.info(
            "Request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "process_time_ms": round(process_time * 1000, 2),
            }
        )
        
        # 응답 헤더에 요청 ID 추가
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(round(process_time * 1000, 2))
        
        return response
```

---

## 2. app/middleware/cors.py

```python
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings


def get_cors_middleware_config() -> dict:
    """CORS 미들웨어 설정 반환"""
    return {
        "allow_origins": settings.CORS_ORIGINS,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["*"],
        "expose_headers": ["X-Request-ID", "X-Process-Time"],
    }
```

---

## 3. app/middleware/error_handler.py

```python
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import (
    AppException,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
    BusinessLogicError,
)

logger = logging.getLogger(__name__)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """애플리케이션 예외 핸들러"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.warning(
        f"Application error: {exc.message}",
        extra={
            "request_id": request_id,
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "path": request.url.path,
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            },
            "request_id": request_id,
        }
    )


async def authentication_error_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """인증 에러 핸들러"""
    return await app_exception_handler(request, exc)


async def authorization_error_handler(request: Request, exc: AuthorizationError) -> JSONResponse:
    """권한 에러 핸들러"""
    return await app_exception_handler(request, exc)


async def not_found_error_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """Not Found 에러 핸들러"""
    return await app_exception_handler(request, exc)


async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """검증 에러 핸들러"""
    return await app_exception_handler(request, exc)


async def business_logic_error_handler(request: Request, exc: BusinessLogicError) -> JSONResponse:
    """비즈니스 로직 에러 핸들러"""
    return await app_exception_handler(request, exc)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """일반 예외 핸들러 (예상치 못한 에러)"""
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.error(
        f"Unexpected error: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "error_type": type(exc).__name__,
        },
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "details": None,
            },
            "request_id": request_id,
        }
    )
```

---

## 4. app/middleware/__init__.py

```python
from app.middleware.logging import RequestLoggingMiddleware
from app.middleware.cors import get_cors_middleware_config
from app.middleware.error_handler import (
    app_exception_handler,
    authentication_error_handler,
    authorization_error_handler,
    not_found_error_handler,
    validation_error_handler,
    business_logic_error_handler,
    generic_exception_handler,
)

__all__ = [
    "RequestLoggingMiddleware",
    "get_cors_middleware_config",
    "app_exception_handler",
    "authentication_error_handler",
    "authorization_error_handler",
    "not_found_error_handler",
    "validation_error_handler",
    "business_logic_error_handler",
    "generic_exception_handler",
]
```

---

## 5. 미들웨어 등록 순서

메인 애플리케이션에서 미들웨어 등록 순서:

```python
# 1. CORS (가장 먼저)
app.add_middleware(CORSMiddleware, **get_cors_middleware_config())

# 2. 요청 로깅
app.add_middleware(RequestLoggingMiddleware)

# 3. 에러 핸들러 등록
app.add_exception_handler(AuthenticationError, authentication_error_handler)
app.add_exception_handler(AuthorizationError, authorization_error_handler)
app.add_exception_handler(NotFoundError, not_found_error_handler)
app.add_exception_handler(ValidationError, validation_error_handler)
app.add_exception_handler(BusinessLogicError, business_logic_error_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)
```

---

## 체크리스트

- [ ] middleware/logging.py 구현
- [ ] middleware/cors.py 구현
- [ ] middleware/error_handler.py 구현
- [ ] middleware/__init__.py 작성
- [ ] 메인 앱에 미들웨어 등록
