from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"
    
    order_item_id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False)
    menu_id = Column(Integer, ForeignKey("menus.menu_id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Integer, nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    menu = relationship("Menu", back_populates="order_items")
    
    @property
    def subtotal(self) -> int:
        return self.quantity * self.unit_price
    
    __table_args__ = (
        CheckConstraint('quantity > 0', name='chk_item_quantity_positive'),
        CheckConstraint('unit_price > 0', name='chk_item_price_positive'),
    )
