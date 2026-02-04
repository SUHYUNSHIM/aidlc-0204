# Phase 1-2: 핵심 설정 모듈

## 목표

애플리케이션 핵심 설정 및 유틸리티 모듈 구현

---

## 1. core/config.py

환경 변수 기반 설정 클래스

```python
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # Database
    database_url: str
    db_pool_size: int = 5
    db_max_overflow: int = 10
    
    # Security
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 16
    
    # Server
    debug: bool = False
    log_level: str = "INFO"
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # SSE
    sse_heartbeat_interval: int = 30
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

## 2. core/database.py

SQLAlchemy 비동기 엔진 및 세션

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_pre_ping=True,
    echo=settings.debug,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

## 3. core/security.py

JWT 토큰 및 비밀번호 해싱

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(hours=settings.jwt_expiration_hours)
    )
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        raise ValueError("Invalid token")
```

---

## 4. core/exceptions.py

커스텀 예외 클래스

```python
class AppException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, 400)


class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message, 403)


class ConflictError(AppException):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, 409)
```

---

## 5. core/cache.py

인메모리 캐시 매니저

```python
from typing import Any, Optional, Dict
from datetime import datetime, timedelta
import threading


class InMemoryCacheManager:
    def __init__(self):
        self._cache: Dict[str, dict] = {}
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            entry = self._cache[key]
            if datetime.utcnow() > entry["expires_at"]:
                del self._cache[key]
                return None
            return entry["value"]
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": datetime.utcnow() + timedelta(seconds=ttl)
            }
        return True
    
    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        prefix = pattern.rstrip("*")
        count = 0
        with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if k.startswith(prefix)]
            for key in keys_to_delete:
                del self._cache[key]
                count += 1
        return count


_cache_manager: Optional[InMemoryCacheManager] = None


def get_cache_manager() -> InMemoryCacheManager:
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = InMemoryCacheManager()
    return _cache_manager
```

---

## 6. core/dependencies.py

FastAPI 의존성 주입

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_token
from app.core.exceptions import AuthenticationError

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    try:
        payload = verify_token(credentials.credentials)
        return payload
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("user_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_table(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("user_type") != "table":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Table access required"
        )
    return current_user
```

---

## 체크리스트

- [ ] core/config.py 구현
- [ ] core/database.py 구현
- [ ] core/security.py 구현
- [ ] core/exceptions.py 구현
- [ ] core/cache.py 구현
- [ ] core/dependencies.py 구현
- [ ] core/__init__.py 작성
