from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base


class OrderHistory(Base):
    __tablename__ = "order_history"
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    table_id = Column(Integer, nullable=False)
    store_id = Column(Integer, nullable=False)
    completed_time = Column(DateTime, server_default=func.now())
    archived_order_data = Column(JSONB, nullable=False)
