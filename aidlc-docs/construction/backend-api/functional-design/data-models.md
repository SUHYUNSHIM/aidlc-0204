# 데이터 모델 상세 설계

## 1. Store (매장)

### 테이블 정의
```sql
CREATE TABLE stores (
    store_id SERIAL PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL,
    admin_username VARCHAR(50) NOT NULL UNIQUE,
    admin_password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SQLAlchemy 모델
```python
class Store(Base):
    __tablename__ = "stores"
    
    store_id = Column(Integer, primary_key=True, autoincrement=True)
    store_name = Column(String(100), nullable=False)
    admin_username = Column(String(50), nullable=False, unique=True)
    admin_password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tables = relationship("Table", back_populates="store", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="store", cascade="all, delete-orphan")
    menus = relationship("Menu", back_populates="store", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="store", cascade="all, delete-orphan")
```

### 비즈니스 규칙
- `store_id`: 자동 증가 정수
- `admin_username`: 전역 고유
- `admin_password_hash`: bcrypt 해시 (최소 8자 원본)

---

## 2. Category (카테고리)

### 테이블 정의
```sql
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    category_name VARCHAR(50) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, category_name)
);

CREATE INDEX idx_categories_store_id ON categories(store_id);
```

### SQLAlchemy 모델
```python
class Category(Base):
    __tablename__ = "categories"
    
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    category_name = Column(String(50), nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    store = relationship("Store", back_populates="categories")
    menus = relationship("Menu", back_populates="category", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('store_id', 'category_name', name='uq_store_category'),
    )
```

### 비즈니스 규칙
- `category_name`: 매장 내 고유, 1-50자
- `display_order`: 낮은 숫자가 먼저 표시

---

## 3. Menu (메뉴)

### 테이블 정의
```sql
CREATE TABLE menus (
    menu_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    menu_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    description TEXT,
    image_base64 TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menus_store_id ON menus(store_id);
CREATE INDEX idx_menus_category_id ON menus(category_id);
```

### SQLAlchemy 모델
```python
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    store = relationship("Store", back_populates="menus")
    category = relationship("Category", back_populates="menus")
    order_items = relationship("OrderItem", back_populates="menu")
    
    __table_args__ = (
        CheckConstraint('price > 0', name='chk_price_positive'),
    )
```

### 비즈니스 규칙
- `price`: 양의 정수 (원 단위), CHECK 제약조건
- `image_base64`: Base64 인코딩된 이미지 (최대 2MB 권장)

---

## 4. Table (테이블)

### 테이블 정의
```sql
CREATE TABLE tables (
    table_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    table_password_hash VARCHAR(255) NOT NULL,
    current_session_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, table_number)
);

CREATE INDEX idx_tables_store_id ON tables(store_id);
```

### SQLAlchemy 모델
```python
class Table(Base):
    __tablename__ = "tables"
    
    table_id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    table_number = Column(Integer, nullable=False)
    table_password_hash = Column(String(255), nullable=False)
    current_session_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    store = relationship("Store", back_populates="tables")
    sessions = relationship("TableSession", back_populates="table", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="table", cascade="all, delete-orphan")
    
    __table_args__ = (
        UniqueConstraint('store_id', 'table_number', name='uq_store_table'),
    )
```

### 비즈니스 규칙
- `table_number`: 1 이상의 정수, 매장 내 고유
- `table_password_hash`: bcrypt 해시 (4자리 숫자 권장)
- `current_session_id`: 활성 세션이 있으면 UUID, 없으면 NULL (트리거로 자동 관리)

---

## 5. TableSession (테이블 세션)

### 테이블 정의
```sql
CREATE TABLE table_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id INTEGER NOT NULL REFERENCES tables(table_id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_table_sessions_table_id ON table_sessions(table_id);
CREATE INDEX idx_table_sessions_active ON table_sessions(is_active) WHERE is_active = TRUE;
```

### SQLAlchemy 모델
```python
from sqlalchemy.dialects.postgresql import UUID
import uuid

class TableSession(Base):
    __tablename__ = "table_sessions"
    
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_id = Column(Integer, ForeignKey("tables.table_id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    table = relationship("Table", back_populates="sessions")
    orders = relationship("Order", back_populates="session", cascade="all, delete-orphan")
```

### 비즈니스 규칙
- `session_id`: PostgreSQL gen_random_uuid()로 자동 생성
- 테이블당 활성 세션은 최대 1개
- 세션 종료 시: `is_active = False`, `end_time = 현재시각`

### 트리거 (자동 세션 관리)
```sql
-- 세션 생성 시 테이블의 current_session_id 업데이트
CREATE OR REPLACE FUNCTION update_table_current_session()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.is_active = TRUE THEN
        UPDATE tables SET current_session_id = NEW.session_id WHERE table_id = NEW.table_id;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- 세션 종료 시 테이블의 current_session_id 초기화
CREATE OR REPLACE FUNCTION clear_table_current_session()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        UPDATE tables SET current_session_id = NULL WHERE table_id = NEW.table_id;
    END IF;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

---

## 6. Order (주문)

### 테이블 정의
```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES table_sessions(session_id) ON DELETE CASCADE,
    table_id INTEGER NOT NULL REFERENCES tables(table_id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount INTEGER NOT NULL CHECK (total_amount > 0),
    status VARCHAR(20) DEFAULT '대기중' CHECK (status IN ('대기중', '준비중', '완료'))
);

CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_time ON orders(order_time);
```

### SQLAlchemy 모델
```python
class Order(Base):
    __tablename__ = "orders"
    
    order_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("table_sessions.session_id", ondelete="CASCADE"), nullable=False)
    table_id = Column(Integer, ForeignKey("tables.table_id", ondelete="CASCADE"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    order_time = Column(DateTime, default=datetime.utcnow)
    total_amount = Column(Integer, nullable=False)
    status = Column(String(20), default="대기중")
    
    # Relationships
    session = relationship("TableSession", back_populates="orders")
    table = relationship("Table", back_populates="orders")
    store = relationship("Store", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint("status IN ('대기중', '준비중', '완료')", name='chk_status'),
        CheckConstraint('total_amount > 0', name='chk_total_positive'),
    )
```

### 비즈니스 규칙
- `status`: 대기중 → 준비중 → 완료 (순차 전환)
- `total_amount`: 주문 항목 합계, 양수 필수

---

## 7. OrderItem (주문 항목)

### 테이블 정의
```sql
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    menu_id INTEGER NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price > 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### SQLAlchemy 모델
```python
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
        CheckConstraint('quantity > 0', name='chk_quantity_positive'),
        CheckConstraint('unit_price > 0', name='chk_unit_price_positive'),
    )
```

### 비즈니스 규칙
- `unit_price`: 주문 시점 가격 스냅샷
- `quantity`: 1 이상의 정수

---

## 8. OrderHistory (주문 이력)

### 테이블 정의
```sql
CREATE TABLE order_history (
    history_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    table_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    completed_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_order_data JSONB NOT NULL
);

CREATE INDEX idx_order_history_store_id ON order_history(store_id);
CREATE INDEX idx_order_history_table_id ON order_history(table_id);
CREATE INDEX idx_order_history_time ON order_history(completed_time);
```

### SQLAlchemy 모델
```python
from sqlalchemy.dialects.postgresql import JSONB

class OrderHistory(Base):
    __tablename__ = "order_history"
    
    history_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(UUID(as_uuid=True), nullable=False)
    table_id = Column(Integer, nullable=False)
    store_id = Column(Integer, nullable=False)
    completed_time = Column(DateTime, default=datetime.utcnow)
    archived_order_data = Column(JSONB, nullable=False)
```

### archived_order_data JSON 구조
```json
{
  "orders": [
    {
      "order_id": 100,
      "order_time": "2026-02-04T12:00:00",
      "total_amount": 13000,
      "status": "완료",
      "items": [
        {"menu_name": "아메리카노", "quantity": 2, "unit_price": 4500},
        {"menu_name": "시저샐러드", "quantity": 1, "unit_price": 8500}
      ]
    }
  ],
  "session_total": 13000
}
```

### 비즈니스 규칙
- 세션 종료 시 모든 주문을 JSON으로 아카이브
- FK 없음 (독립적 보관)

---

## ER 다이어그램

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Store     │───1:N─│   Table     │───1:N─│TableSession │
│             │       │             │       │             │
│store_id(PK) │       │table_id(PK) │       │session_id   │
│  INTEGER    │       │  INTEGER    │       │   (UUID)    │
│ store_name  │       │ store_id FK │       │ table_id FK │
│admin_user   │       │table_number │       │ start_time  │
│admin_pass   │       │table_pass   │       │ end_time    │
└─────────────┘       │curr_session │       │ is_active   │
      │               └─────────────┘       └─────────────┘
      │                     │                     │
      │1:N                  │1:N                  │1:N
      ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Category   │───1:N─│    Menu     │       │   Order     │
│             │       │             │       │             │
│category_id  │       │ menu_id PK  │       │ order_id PK │
│ store_id FK │       │ store_id FK │       │session_id FK│
│category_name│       │category_id  │       │ table_id FK │
│display_order│       │ menu_name   │       │ store_id FK │
└─────────────┘       │ price       │       │total_amount │
                      │ description │       │ status      │
                      │image_base64 │       │ order_time  │
                      │display_order│       └─────────────┘
                      └─────────────┘             │
                            │                    │1:N
                            │                    ▼
                            │              ┌─────────────┐
                            └──────────────│ OrderItem   │
                                    N:1    │             │
                                           │order_item_id│
                                           │ order_id FK │
                                           │ menu_id FK  │
                                           │ quantity    │
                                           │ unit_price  │
                                           └─────────────┘

┌─────────────────┐
│  OrderHistory   │  (독립 테이블 - FK 없음)
│                 │
│ history_id PK   │
│ session_id UUID │
│ table_id INT    │
│ store_id INT    │
│ completed_time  │
│archived_order   │
│   _data JSONB   │
└─────────────────┘
```
