from pydantic import BaseModel, Field, field_validator
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

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
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
