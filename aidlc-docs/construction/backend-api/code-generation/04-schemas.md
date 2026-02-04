# Phase 2-2: Pydantic 스키마

## 목표

API 요청/응답을 위한 Pydantic 스키마 구현

---

## 1. schemas/common.py

```python
from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
```

---

## 2. schemas/auth.py

```python
from pydantic import BaseModel, Field
from uuid import UUID


class TableLoginRequest(BaseModel):
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
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 57600
    table_id: int
    table_number: int
    session_id: UUID
    store_id: int
    store_name: str


class AdminLoginRequest(BaseModel):
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
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 57600
    store_id: int
    store_name: str
    username: str
```

---

## 3. schemas/menu.py

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MenuItemResponse(BaseModel):
    menu_id: int
    menu_name: str
    price: int
    description: Optional[str] = None
    image_base64: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    category_id: int
    category_name: str
    display_order: int
    menus: List[MenuItemResponse]

    class Config:
        from_attributes = True


class MenuListResponse(BaseModel):
    store_id: int
    categories: List[CategoryResponse]


class MenuCreate(BaseModel):
    category_id: int = Field(..., description="카테고리 ID")
    menu_name: str = Field(..., min_length=1, max_length=100)
    price: int = Field(..., gt=0, description="가격 (원)")
    description: Optional[str] = Field(None, max_length=500)
    image_base64: Optional[str] = None
    display_order: Optional[int] = Field(0, ge=0)


class MenuUpdate(BaseModel):
    category_id: Optional[int] = None
    menu_name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[int] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    image_base64: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)


class MenuResponse(BaseModel):
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

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=50)
    display_order: Optional[int] = Field(0, ge=0)


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = Field(None, min_length=1, max_length=50)
    display_order: Optional[int] = Field(None, ge=0)


class CategoryBriefResponse(BaseModel):
    category_id: int
    category_name: str
    display_order: int
    menu_count: int

    class Config:
        from_attributes = True
```

---

## 4. schemas/order.py

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class OrderItemCreate(BaseModel):
    menu_id: int = Field(..., description="메뉴 ID")
    quantity: int = Field(..., gt=0, description="수량")


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1, description="주문 항목")


class OrderItemResponse(BaseModel):
    order_item_id: int
    menu_id: int
    menu_name: str
    quantity: int
    unit_price: int
    subtotal: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    order_id: int
    table_id: int
    table_number: int
    session_id: UUID
    total_amount: int
    status: str
    order_time: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderBriefResponse(BaseModel):
    order_id: int
    total_amount: int
    status: str
    order_time: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class CustomerOrdersResponse(BaseModel):
    session_id: UUID
    table_number: int
    total_session_amount: int
    orders: List[OrderBriefResponse]


class TableOrdersResponse(BaseModel):
    table_id: int
    table_number: int
    session_id: Optional[UUID]
    total_amount: int
    order_count: int
    orders: List[OrderBriefResponse]


class AdminOrdersResponse(BaseModel):
    store_id: int
    tables: List[TableOrdersResponse]


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="대기중/준비중/완료")

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ["대기중", "준비중", "완료"]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {valid_statuses}")
        return v


class OrderStatusResponse(BaseModel):
    order_id: int
    status: str


class OrderDeleteResponse(BaseModel):
    message: str
    order_id: int
    table_id: int
```

---

## 5. schemas/table.py

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class TableCreate(BaseModel):
    table_number: int = Field(..., gt=0, description="테이블 번호")
    table_password: str = Field(..., min_length=1, description="테이블 비밀번호")


class TableResponse(BaseModel):
    table_id: int
    table_number: int
    store_id: int
    current_session_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class SessionEndResponse(BaseModel):
    message: str
    table_id: int
    table_number: int
    session_id: UUID
    total_session_amount: int
    order_count: int


class OrderHistoryItem(BaseModel):
    history_id: int
    session_id: UUID
    completed_time: datetime
    archived_order_data: dict

    class Config:
        from_attributes = True


class TableHistoryResponse(BaseModel):
    table_id: int
    table_number: int
    total_count: int
    history: List[OrderHistoryItem]
```

---

## 6. schemas/sse.py

```python
from pydantic import BaseModel
from typing import List
from datetime import datetime
from uuid import UUID
from app.schemas.order import OrderItemResponse


class SSEOrderCreated(BaseModel):
    event: str = "order_created"
    order_id: int
    table_id: int
    table_number: int
    total_amount: int
    status: str
    order_time: datetime
    items: List[OrderItemResponse]


class SSEOrderUpdated(BaseModel):
    event: str = "order_updated"
    order_id: int
    table_id: int
    status: str


class SSEOrderDeleted(BaseModel):
    event: str = "order_deleted"
    order_id: int
    table_id: int


class SSESessionEnded(BaseModel):
    event: str = "session_ended"
    table_id: int
    table_number: int
    session_id: UUID
```

---

## 7. schemas/__init__.py

```python
from app.schemas.common import MessageResponse, ErrorResponse
from app.schemas.auth import (
    TableLoginRequest, TableLoginResponse,
    AdminLoginRequest, AdminLoginResponse,
)
from app.schemas.menu import (
    MenuItemResponse, CategoryResponse, MenuListResponse,
    MenuCreate, MenuUpdate, MenuResponse,
    CategoryCreate, CategoryUpdate, CategoryBriefResponse,
)
from app.schemas.order import (
    OrderItemCreate, OrderCreate,
    OrderItemResponse, OrderResponse, OrderBriefResponse,
    CustomerOrdersResponse, TableOrdersResponse, AdminOrdersResponse,
    OrderStatusUpdate, OrderStatusResponse, OrderDeleteResponse,
)
from app.schemas.table import (
    TableCreate, TableResponse,
    SessionEndResponse, OrderHistoryItem, TableHistoryResponse,
)

__all__ = [
    # Common
    "MessageResponse", "ErrorResponse",
    # Auth
    "TableLoginRequest", "TableLoginResponse",
    "AdminLoginRequest", "AdminLoginResponse",
    # Menu
    "MenuItemResponse", "CategoryResponse", "MenuListResponse",
    "MenuCreate", "MenuUpdate", "MenuResponse",
    "CategoryCreate", "CategoryUpdate", "CategoryBriefResponse",
    # Order
    "OrderItemCreate", "OrderCreate",
    "OrderItemResponse", "OrderResponse", "OrderBriefResponse",
    "CustomerOrdersResponse", "TableOrdersResponse", "AdminOrdersResponse",
    "OrderStatusUpdate", "OrderStatusResponse", "OrderDeleteResponse",
    # Table
    "TableCreate", "TableResponse",
    "SessionEndResponse", "OrderHistoryItem", "TableHistoryResponse",
]
```

---

## 체크리스트

- [ ] schemas/common.py 구현
- [ ] schemas/auth.py 구현
- [ ] schemas/menu.py 구현
- [ ] schemas/order.py 구현
- [ ] schemas/table.py 구현
- [ ] schemas/sse.py 구현
- [ ] schemas/__init__.py 작성
