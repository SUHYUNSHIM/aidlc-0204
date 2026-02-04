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
