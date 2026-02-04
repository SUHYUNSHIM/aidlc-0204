from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """기본 헬스 체크"""
    return {"status": "healthy"}


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """준비 상태 체크 (DB 연결 포함)"""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "checks": {"database": "connected"}
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "checks": {"database": f"error: {str(e)}"}
        }


@router.get("/health/live")
async def liveness_check():
    """생존 상태 체크"""
    return {"status": "alive"}
