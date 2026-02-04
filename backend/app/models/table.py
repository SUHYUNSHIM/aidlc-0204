from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Table(Base):
    __tablename__ = "tables"
    
    table_id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    table_number = Column(Integer, nullable=False)
    table_password_hash = Column(String(255), nullable=False)
    current_session_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    store = relationship("Store", back_populates="tables")
    sessions = relationship("TableSession", back_populates="table", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="table", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('store_id', 'table_number', name='uq_store_table'),
    )
