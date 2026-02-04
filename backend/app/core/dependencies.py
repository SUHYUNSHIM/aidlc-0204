from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """현재 인증된 사용자 정보 반환"""
    try:
        payload = verify_token(credentials.credentials)
        return payload
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """관리자 권한 확인"""
    if current_user.get("user_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_table(current_user: dict = Depends(get_current_user)) -> dict:
    """테이블 권한 확인"""
    if current_user.get("user_type") != "table":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Table access required"
        )
    return current_user
