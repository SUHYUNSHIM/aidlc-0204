import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.middleware import (
    RequestLoggingMiddleware,
    app_exception_handler,
    generic_exception_handler,
)
from app.core.exceptions import AppException

# 로깅 설정
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # Startup
    logger.info(
        f"Application starting: {settings.app_name}",
        extra={
            "app_name": settings.app_name,
            "environment": settings.environment,
            "debug": settings.debug,
        }
    )
    
    yield
    
    # Shutdown
    logger.info("Application shutting down")
    await engine.dispose()


def create_application() -> FastAPI:
    """FastAPI 애플리케이션 팩토리"""
    
    app = FastAPI(
        title=settings.app_name,
        description="테이블 오더 서비스 백엔드 API",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        openapi_url="/openapi.json" if settings.debug else None,
        lifespan=lifespan,
    )
    
    # CORS 미들웨어
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time"],
    )
    
    # 요청 로깅 미들웨어
    app.add_middleware(RequestLoggingMiddleware)
    
    # 예외 핸들러 등록
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
        "name": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs" if settings.debug else None,
    }
