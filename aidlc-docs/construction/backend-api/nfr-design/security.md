# 보안 설계 (Security Design)

## 개요

테이블 오더 서비스의 보안 요구사항 및 구현 설계입니다.

---

## 1. 인증 (Authentication)

### 1.1 JWT 토큰 기반 인증

```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# 설정
SECRET_KEY = "your-secret-key-from-env"  # 환경변수에서 로드
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 16

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT 액세스 토큰 생성"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """JWT 토큰 검증 및 페이로드 반환"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

### 1.2 JWT 페이로드 구조

```json
{
  "sub": "admin_uuid",
  "store_id": "store_uuid",
  "role": "admin",
  "exp": 1707123456,
  "iat": 1707065856
}
```

### 1.3 토큰 보안 정책

| 항목 | 설정값 | 근거 |
|-----|-------|-----|
| 알고리즘 | HS256 | 단일 서버 환경에 적합 |
| 유효기간 | 16시간 | 영업 시간 커버 |
| Secret Key 길이 | 256bit 이상 | 보안 권장사항 |
| Refresh Token | 미사용 | MVP 단순화 |

---

## 2. 비밀번호 보안

### 2.1 bcrypt 해싱

```python
# app/core/security.py (계속)

def hash_password(password: str) -> str:
    """비밀번호 해싱 (bcrypt)"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)
```

### 2.2 비밀번호 정책

```python
# app/schemas/admin.py
import re
from pydantic import validator

class AdminCreate(BaseModel):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('비밀번호에 영문자가 포함되어야 합니다')
        if not re.search(r'\d', v):
            raise ValueError('비밀번호에 숫자가 포함되어야 합니다')
        return v
```

---

## 3. 인가 (Authorization)

### 3.1 역할 기반 접근 제어

```python
# app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from app.core.security import security, verify_token

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """현재 인증된 관리자 정보 반환"""
    payload = verify_token(credentials.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    return payload


async def get_current_store_id(
    current_admin: dict = Depends(get_current_admin)
) -> str:
    """현재 관리자의 store_id 반환"""
    store_id = current_admin.get("store_id")
    if not store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="매장 정보가 없습니다"
        )
    return store_id
```

### 3.2 API 엔드포인트별 권한

| 엔드포인트 | 인증 필요 | 권한 |
|-----------|---------|-----|
| POST /api/v1/auth/login | ❌ | Public |
| GET /api/v1/tables/{code}/menu | ❌ | Public (테이블 코드로 검증) |
| POST /api/v1/orders | ❌ | Public (세션 기반) |
| GET /api/v1/admin/orders | ✅ | Admin (store_id 필터) |
| PATCH /api/v1/admin/orders/{id}/status | ✅ | Admin (store_id 검증) |
| GET /api/v1/admin/orders/stream | ✅ | Admin (store_id 필터) |

---

## 4. 멀티테넌트 데이터 격리

### 4.1 Store ID 기반 격리

```python
# app/repositories/order_repository.py
class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_orders_by_store(
        self, 
        store_id: UUID,
        status: Optional[OrderStatus] = None
    ) -> List[Order]:
        """매장별 주문 조회 - store_id 필터 필수"""
        query = select(Order).where(Order.store_id == store_id)
        if status:
            query = query.where(Order.status == status)
        result = await self.db.execute(query)
        return result.scalars().all()
```

### 4.2 데이터 격리 검증

```python
# app/services/order_service.py
async def update_order_status(
    self,
    order_id: UUID,
    store_id: UUID,  # 현재 관리자의 store_id
    new_status: OrderStatus
) -> Order:
    """주문 상태 업데이트 - 매장 소유권 검증"""
    order = await self.order_repo.get_by_id(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다")
    
    # 매장 소유권 검증 (Critical!)
    if order.store_id != store_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    order.status = new_status
    return await self.order_repo.update(order)
```

---

## 5. 입력 검증 및 SQL Injection 방지

### 5.1 Pydantic 입력 검증

```python
# app/schemas/order.py
from pydantic import BaseModel, validator, constr
from typing import List
from uuid import UUID

class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int
    special_requests: Optional[constr(max_length=500)] = None
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v < 1 or v > 99:
            raise ValueError('수량은 1-99 사이여야 합니다')
        return v


class OrderCreate(BaseModel):
    session_id: UUID
    items: List[OrderItemCreate]
    
    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('주문 항목이 비어있습니다')
        if len(v) > 50:
            raise ValueError('한 번에 50개 이상 주문할 수 없습니다')
        return v
```

### 5.2 SQLAlchemy ORM 사용

```python
# SQL Injection 방지 - ORM 사용
# ❌ 위험한 방식 (Raw SQL)
# query = f"SELECT * FROM orders WHERE store_id = '{store_id}'"

# ✅ 안전한 방식 (SQLAlchemy ORM)
query = select(Order).where(Order.store_id == store_id)
```

---

## 6. CORS 설정

### 6.1 CORS 미들웨어 설정

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # 개발 환경
        "https://order.example.com",  # 프로덕션 고객 UI
        "https://admin.example.com",  # 프로덕션 관리자 UI
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)
```

### 6.2 환경별 CORS 설정

```python
# app/core/config.py
class Settings(BaseSettings):
    CORS_ORIGINS: List[str] = []
    
    @validator('CORS_ORIGINS', pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

# .env
# CORS_ORIGINS=http://localhost:3000,https://order.example.com
```

---

## 7. 보안 헤더

### 7.1 보안 헤더 미들웨어

```python
# app/middleware/security_headers.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 보안 헤더 추가
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
```

---

## 8. 보안 체크리스트

| 항목 | 구현 | 우선순위 |
|-----|-----|---------|
| JWT 인증 | ✅ | P0 |
| bcrypt 비밀번호 해싱 | ✅ | P0 |
| Store ID 기반 데이터 격리 | ✅ | P0 |
| Pydantic 입력 검증 | ✅ | P0 |
| SQLAlchemy ORM (SQL Injection 방지) | ✅ | P0 |
| CORS 설정 | ✅ | P0 |
| 보안 헤더 | ✅ | P1 |
| Rate Limiting | ⏳ (향후) | P2 |
| API Key (외부 연동) | ⏳ (향후) | P2 |
