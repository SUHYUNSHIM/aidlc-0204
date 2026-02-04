from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"
    
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    category_name = Column(String(50), nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    store = relationship("Store", back_populates="categories")
    menus = relationship("Menu", back_populates="category", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('store_id', 'category_name', name='uq_store_category'),
    )
