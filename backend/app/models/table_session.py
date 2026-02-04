from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class TableSession(Base):
    __tablename__ = "table_sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(Integer, ForeignKey("tables.table_id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, server_default=func.now())
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    table = relationship("Table", back_populates="sessions")
    orders = relationship("Order", back_populates="session", cascade="all, delete-orphan")
