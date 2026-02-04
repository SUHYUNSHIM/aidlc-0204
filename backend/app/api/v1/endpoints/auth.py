from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas import (
    TableLoginRequest, TableLoginResponse,
    AdminLoginRequest, AdminLoginResponse,
)
from app.services import AuthService
from app.repositories import StoreRepository, TableRepository, SessionRepository

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(
        StoreRepository(db),
        TableRepository(db),
        SessionRepository(db),
    )


@router.post("/table/login", response_model=TableLoginResponse)
async def table_login(
    request: TableLoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """테이블 로그인"""
    return await auth_service.authenticate_table(
        request.store_id,
        request.table_number,
        request.table_password,
    )


@router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(
    request: AdminLoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """관리자 로그인"""
    return await auth_service.authenticate_admin(
        request.username,
        request.password,
    )
