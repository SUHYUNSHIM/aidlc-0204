from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"
    
    order_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("table_sessions.session_id", ondelete="CASCADE"), nullable=False)
    table_id = Column(Integer, ForeignKey("tables.table_id", ondelete="CASCADE"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    order_time = Column(DateTime, server_default=func.now())
    total_amount = Column(Integer, nullable=False)
    status = Column(String(20), default="대기중")
    
    # Relationships
    session = relationship("TableSession", back_populates="orders")
    table = relationship("Table", back_populates="orders")
    store = relationship("Store", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint('total_amount > 0', name='chk_order_total_positive'),
        CheckConstraint("status IN ('대기중', '준비중', '완료')", name='chk_order_status'),
    )
