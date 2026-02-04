# Pydantic 스키마 정의

## 1. 공통 스키마

### 기본 응답

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class MessageResponse(BaseModel):
    """일반 메시지 응답"""
    message: str

class ErrorResponse(BaseModel):
    """에러 응답"""
    detail: str
```

---

## 2. 인증 스키마 (Auth)

### 테이블 로그인

```python
class TableLoginRequest(BaseModel):
    """테이블 로그인 요청"""
    store_id: int = Field(..., description="매장 ID")
    table_number: int = Field(..., ge=1, description="테이블 번호")
    table_password: str = Field(..., min_length=1, description="테이블 비밀번호")

    class Config:
        json_schema_extra = {
            "example": {
                "store_id": 1,
                "table_number": 5,
                "table_password": "1234"
            }
        }

class TableLoginResponse(BaseModel):
    """테이블 로그인 응답"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 57600  # 16시간
    table_id: int
    table_number: int
    session_id: UUID
    store_id: int
    store_name: str
```

### 관리자 로그인

```python
class AdminLoginRequest(BaseModel):
    """관리자 로그인 요청"""
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)

    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "admin123"
            }
        }

class AdminLoginResponse(BaseModel):
    """관리자 로그인 응답"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 57600
    store_id: int
    store_name: str
    username: str
```

---

## 3. 메뉴 스키마 (Menu)

### 메뉴 조회

```python
class MenuItemResponse(BaseModel):
    """메뉴 항목"""
    menu_id: int
    menu_name: str
    price: int
    description: Optional[str] = None
    image_base64: Optional[str] = None
    display_order: int

class CategoryResponse(BaseModel):
    """카테고리 (메뉴 포함)"""
    category_id: int
    category_name: str
    display_order: int
    menus: List[MenuItemResponse]

class MenuListResponse(BaseModel):
    """메뉴 목록 응답"""
    store_id: int
    categories: List[CategoryResponse]
```

### 메뉴 생성/수정

```python
class MenuCreate(BaseModel):
    """메뉴 생성 요청"""
    category_id: int = Field(..., description="카테고리 ID")
    menu_name: str = Field(..., min_length=1, max_length=100, description="메뉴명")
    price: int = Field(..., gt=0, description="가격 (원)")
    description: Optional[str] = Field(None, max_length=500, description="설명")
    image_base64: Optional[str] = Field(None, description="Base64 이미지")
    display_order: Optional[int] = Field(0, ge=0, description="표시 순서")

    class Config:
        json_schema_extra = {
            "example": {
                "category_id": 1,
                "menu_name": "아메리카노",
                "price": 4500,
                "description": "깔끔하고 진한 에스프레소의 맛",
                "display_order": 1
            }
        }

class MenuUpdate(BaseModel):
    """메뉴 수정 요청 (부분 업데이트)"""
    category_id: Optional[int] = None
    menu_name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[int] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    image_base64: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)

class MenuResponse(BaseModel):
    """메뉴 응답"""
    menu_id: int
    menu_name: str
    price: int
    category_id: int
    category_name: Optional[str] = None
    description: Optional[str] = None
    image_base64: Optional[str] = None
    display_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
```

---

## 4. 주문 스키마 (Order)

### 주문 생성

```python
class OrderItemCreate(BaseModel):
    """주문 항목 생성"""
    menu_id: int = Field(..., description="메뉴 ID")
    quantity: int = Field(..., gt=0, description="수량")

    class Config:
        json_schema_extra = {
            "example": {
                "menu_id": 1,
                "quantity": 2
            }
        }

class OrderCreate(BaseModel):
    """주문 생성 요청"""
    items: List[OrderItemCreate] = Field(..., min_length=1, description="주문 항목")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {"menu_id": 1, "quantity": 2},
                    {"menu_id": 3, "quantity": 1}
                ]
            }
        }
```

### 주문 응답

```python
class OrderItemResponse(BaseModel):
    """주문 항목 응답"""
    order_item_id: int
    menu_id: int
    menu_name: str  # Menu 테이블에서 JOIN
    quantity: int
    unit_price: int
    subtotal: int  # quantity * unit_price

class OrderResponse(BaseModel):
    """주문 응답"""
    order_id: int
    table_id: int
    table_number: int
    session_id: UUID
    total_amount: int
    status: str
    order_time: datetime
    items: List[OrderItemResponse]

class OrderBriefResponse(BaseModel):
    """주문 간략 응답 (목록용)"""
    order_id: int
    total_amount: int
    status: str
    order_time: datetime
    items: List[OrderItemResponse]
```

### 주문 목록 (고객용)

```python
class CustomerOrdersResponse(BaseModel):
    """고객용 주문 내역"""
    session_id: UUID
    table_number: int
    total_session_amount: int
    orders: List[OrderBriefResponse]
``` 주문 목록 (고객용)

```python
class CustomerOrdersResponse(BaseModel):
    """고객용 주문 내역"""
    session_id: str
    table_number: int
    total_session_amount: int
    orders: List[OrderBriefResponse]
```

### 주문 목록 (관리자용)

```python
class TableOrdersResponse(BaseModel):
    """테이블별 주문 현황"""
    table_id: int
    table_number: int
    session_id: Optional[str]
    total_amount: int
    order_count: int
    orders: List[OrderBriefResponse]

class AdminOrdersResponse(BaseModel):
    """관리자용 주문 목록"""
    store_id: str
    tables: List[TableOrdersResponse]
```

### 주문 상태 변경

```python
class OrderStatusUpdate(BaseModel):
    """주문 상태 변경"""
    status: str = Field(..., description="대기중/준비중/완료")

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ["대기중", "준비중", "완료"]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {valid_statuses}")
        return v

class OrderStatusResponse(BaseModel):
    """주문 상태 변경 응답"""
    order_id: int
    order_number: str
    status: str
    updated_at: datetime
```

### 주문 삭제

```python
class OrderDeleteResponse(BaseModel):
    """주문 삭제 응답"""
    message: str
    order_id: int
    table_id: int
    table_total_amount: int
```

---

## 5. 테이블 스키마 (Table)

### 테이블 생성

```python
class TableCreate(BaseModel):
    """테이블 생성 요청"""
    table_number: int = Field(..., gt=0, description="테이블 번호")
    table_password: str = Field(..., min_length=1, description="테이블 비밀번호")

    class Config:
        json_schema_extra = {
            "example": {
                "table_number": 10,
                "table_password": "1234"
            }
        }

class TableResponse(BaseModel):
    """테이블 응답"""
    table_id: int
    table_number: int
    store_id: str
    current_session_id: Optional[str] = None
    message: Optional[str] = None
```

### 세션 종료

```python
class SessionEndResponse(BaseModel):
    """세션 종료 응답"""
    message: str
    table_id: int
    table_number: int
    session_id: str
    total_session_amount: int
    order_count: int
    archived_at: datetime
```

### 과거 내역

```python
class OrderHistoryItem(BaseModel):
    """과거 주문 이력 항목"""
    history_id: int
    session_id: str
    session_start_time: datetime
    session_end_time: datetime
    archived_at: datetime
    total_session_amount: int
    order_data: dict  # JSON 데이터

class TableHistoryResponse(BaseModel):
    """테이블 과거 내역 응답"""
    table_id: int
    table_number: int
    total_count: int
    history: List[OrderHistoryItem]
```

---

## 6. SSE 이벤트 스키마

```python
class SSEOrderCreated(BaseModel):
    """SSE: 새 주문 생성"""
    order_id: int
    table_id: int
    table_number: int
    order_number: str
    total_amount: int
    status: str
    order_time: datetime
    items: List[OrderItemResponse]

class SSEOrderUpdated(BaseModel):
    """SSE: 주문 상태 변경"""
    order_id: int
    table_id: int
    status: str
    updated_at: datetime

class SSEOrderDeleted(BaseModel):
    """SSE: 주문 삭제"""
    order_id: int
    table_id: int
    table_total_amount: int

class SSESessionEnded(BaseModel):
    """SSE: 세션 종료"""
    table_id: int
    table_number: int
    session_id: str
```

---

## 7. 카테고리 스키마 (Category)

```python
class CategoryCreate(BaseModel):
    """카테고리 생성"""
    category_name: str = Field(..., min_length=1, max_length=50)
    display_order: Optional[int] = Field(0, ge=0)

class CategoryUpdate(BaseModel):
    """카테고리 수정"""
    category_name: Optional[str] = Field(None, min_length=1, max_length=50)
    display_order: Optional[int] = Field(None, ge=0)

class CategoryBriefResponse(BaseModel):
    """카테고리 간략 응답"""
    category_id: int
    category_name: str
    display_order: int
    menu_count: int
```
