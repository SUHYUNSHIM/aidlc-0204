# Phase 2-1: SQLAlchemy 모델

## 목표

`database/schema/schema.sql` 기준 SQLAlchemy ORM 모델 구현

---

## 1. models/store.py

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Store(Base):
    __tablename__ = "stores"
    
    store_id = Column(Integer, primary_key=True, autoincrement=True)
    store_name = Column(String(100), nullable=False)
    admin_username = Column(String(50), unique=True, nullable=False)
    admin_password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    categories = relationship("Category", back_populates="store", cascade="all, delete-orphan")
    menus = relationship("Menu", back_populates="store", cascade="all, delete-orphan")
    tables = relationship("Table", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")
```

---

## 2. models/category.py

```python
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
```

---

## 3. models/menu.py

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Menu(Base):
    __tablename__ = "menus"
    
    menu_id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="CASCADE"), nullable=False)
    menu_name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    image_base64 = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    store = relationship("Store", back_populates="menus")
    category = relationship("Category", back_populates="menus")
    order_items = relationship("OrderItem", back_populates="menu")
    
    __table_args__ = (
        CheckConstraint('price > 0', name='chk_menu_price_positive'),
    )
```

---

## 4. models/table.py

```python
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
```

---

## 5. models/table_session.py

```python
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
```

---

## 6. models/order.py

```python
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
```

---

## 7. models/order_item.py

```python
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
```

---

## 8. models/order_history.py

```python
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
```

---

## 9. models/__init__.py

```python
from app.models.store import Store
from app.models.category import Category
from app.models.menu import Menu
from app.models.table import Table
from app.models.table_session import TableSession
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.order_history import OrderHistory

__all__ = [
    "Store",
    "Category",
    "Menu",
    "Table",
    "TableSession",
    "Order",
    "OrderItem",
    "OrderHistory",
]
```

---

## 체크리스트

- [ ] models/store.py 구현
- [ ] models/category.py 구현
- [ ] models/menu.py 구현
- [ ] models/table.py 구현
- [ ] models/table_session.py 구현
- [ ] models/order.py 구현
- [ ] models/order_item.py 구현
- [ ] models/order_history.py 구현
- [ ] models/__init__.py 작성
