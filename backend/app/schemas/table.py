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
