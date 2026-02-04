# Phase 2-3: Repository 구현

## 목표

데이터 액세스 레이어 Repository 클래스 구현

---

## 1. repositories/store_repository.py

```python
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Store


class StoreRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, store_id: int) -> Optional[Store]:
        result = await self.db.execute(
            select(Store).where(Store.store_id == store_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_admin_username(self, username: str) -> Optional[Store]:
        result = await self.db.execute(
            select(Store).where(Store.admin_username == username)
        )
        return result.scalar_one_or_none()
    
    async def create(self, store: Store) -> Store:
        self.db.add(store)
        await self.db.commit()
        await self.db.refresh(store)
        return store
```

---

## 2. repositories/category_repository.py

```python
from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Category, Menu


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, category_id: int) -> Optional[Category]:
        result = await self.db.execute(
            select(Category).where(Category.category_id == category_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_store(self, store_id: int) -> List[Category]:
        result = await self.db.execute(
            select(Category)
            .where(Category.store_id == store_id)
            .order_by(Category.display_order)
        )
        return list(result.scalars().all())
    
    async def create(self, category: Category) -> Category:
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category
    
    async def update(self, category: Category) -> Category:
        await self.db.commit()
        await self.db.refresh(category)
        return category
    
    async def delete(self, category_id: int) -> bool:
        category = await self.get_by_id(category_id)
        if category:
            await self.db.delete(category)
            await self.db.commit()
            return True
        return False
    
    async def count_menus(self, category_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Menu.menu_id))
            .where(Menu.category_id == category_id)
        )
        return result.scalar() or 0
```

---

## 3. repositories/menu_repository.py

```python
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Menu


class MenuRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, menu_id: int) -> Optional[Menu]:
        result = await self.db.execute(
            select(Menu).where(Menu.menu_id == menu_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_store(self, store_id: int) -> List[Menu]:
        result = await self.db.execute(
            select(Menu)
            .where(Menu.store_id == store_id)
            .order_by(Menu.display_order)
        )
        return list(result.scalars().all())
    
    async def get_by_category(self, category_id: int) -> List[Menu]:
        result = await self.db.execute(
            select(Menu)
            .where(Menu.category_id == category_id)
            .order_by(Menu.display_order)
        )
        return list(result.scalars().all())
    
    async def create(self, menu: Menu) -> Menu:
        self.db.add(menu)
        await self.db.commit()
        await self.db.refresh(menu)
        return menu
    
    async def update(self, menu: Menu) -> Menu:
        await self.db.commit()
        await self.db.refresh(menu)
        return menu
    
    async def delete(self, menu_id: int) -> bool:
        menu = await self.get_by_id(menu_id)
        if menu:
            await self.db.delete(menu)
            await self.db.commit()
            return True
        return False
```

---

## 4. repositories/table_repository.py

```python
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Table


class TableRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, table_id: int) -> Optional[Table]:
        result = await self.db.execute(
            select(Table).where(Table.table_id == table_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_store_and_number(
        self, store_id: int, table_number: int
    ) -> Optional[Table]:
        result = await self.db.execute(
            select(Table).where(
                Table.store_id == store_id,
                Table.table_number == table_number
            )
        )
        return result.scalar_one_or_none()
    
    async def get_all_by_store(self, store_id: int) -> List[Table]:
        result = await self.db.execute(
            select(Table)
            .where(Table.store_id == store_id)
            .order_by(Table.table_number)
        )
        return list(result.scalars().all())
    
    async def create(self, table: Table) -> Table:
        self.db.add(table)
        await self.db.commit()
        await self.db.refresh(table)
        return table
    
    async def update(self, table: Table) -> Table:
        await self.db.commit()
        await self.db.refresh(table)
        return table
```

---

## 5. repositories/session_repository.py

```python
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import TableSession


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, session_id: UUID) -> Optional[TableSession]:
        result = await self.db.execute(
            select(TableSession).where(TableSession.session_id == session_id)
        )
        return result.scalar_one_or_none()
    
    async def get_active_by_table(self, table_id: int) -> Optional[TableSession]:
        result = await self.db.execute(
            select(TableSession).where(
                TableSession.table_id == table_id,
                TableSession.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def create(self, session: TableSession) -> TableSession:
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session
    
    async def update(self, session: TableSession) -> TableSession:
        await self.db.commit()
        await self.db.refresh(session)
        return session
```

---

## 6. repositories/order_repository.py

```python
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Order, OrderItem, TableSession


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, order_id: int) -> Optional[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.order_id == order_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_session(self, session_id: UUID) -> List[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.session_id == session_id)
            .order_by(Order.order_time.desc())
        )
        return list(result.scalars().all())
    
    async def get_by_store(
        self, 
        store_id: int, 
        status: Optional[str] = None,
        active_session_only: bool = True
    ) -> List[Order]:
        query = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.store_id == store_id)
        )
        
        if status:
            query = query.where(Order.status == status)
        
        if active_session_only:
            query = query.join(TableSession).where(TableSession.is_active == True)
        
        query = query.order_by(Order.order_time.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create(self, order: Order) -> Order:
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order
    
    async def update(self, order: Order) -> Order:
        await self.db.commit()
        await self.db.refresh(order)
        return order
    
    async def delete(self, order_id: int) -> bool:
        order = await self.get_by_id(order_id)
        if order:
            await self.db.delete(order)
            await self.db.commit()
            return True
        return False
    
    async def calculate_total_by_session(self, session_id: UUID) -> int:
        result = await self.db.execute(
            select(func.sum(Order.total_amount))
            .where(Order.session_id == session_id)
        )
        return result.scalar() or 0
```

---

## 7. repositories/history_repository.py

```python
from typing import Optional, List
from datetime import date
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import OrderHistory


class HistoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, history_id: int) -> Optional[OrderHistory]:
        result = await self.db.execute(
            select(OrderHistory).where(OrderHistory.history_id == history_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_table(
        self,
        table_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[OrderHistory]:
        query = select(OrderHistory).where(OrderHistory.table_id == table_id)
        
        if start_date:
            query = query.where(OrderHistory.completed_time >= start_date)
        if end_date:
            query = query.where(OrderHistory.completed_time <= end_date)
        
        query = query.order_by(OrderHistory.completed_time.desc())
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def count_by_table(
        self,
        table_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> int:
        query = select(func.count(OrderHistory.history_id)).where(
            OrderHistory.table_id == table_id
        )
        
        if start_date:
            query = query.where(OrderHistory.completed_time >= start_date)
        if end_date:
            query = query.where(OrderHistory.completed_time <= end_date)
        
        result = await self.db.execute(query)
        return result.scalar() or 0
    
    async def create(self, history: OrderHistory) -> OrderHistory:
        self.db.add(history)
        await self.db.commit()
        await self.db.refresh(history)
        return history
```

---

## 8. repositories/__init__.py

```python
from app.repositories.store_repository import StoreRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.menu_repository import MenuRepository
from app.repositories.table_repository import TableRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.history_repository import HistoryRepository

__all__ = [
    "StoreRepository",
    "CategoryRepository",
    "MenuRepository",
    "TableRepository",
    "SessionRepository",
    "OrderRepository",
    "HistoryRepository",
]
```

---

## 체크리스트

- [ ] repositories/store_repository.py 구현
- [ ] repositories/category_repository.py 구현
- [ ] repositories/menu_repository.py 구현
- [ ] repositories/table_repository.py 구현
- [ ] repositories/session_repository.py 구현
- [ ] repositories/order_repository.py 구현
- [ ] repositories/history_repository.py 구현
- [ ] repositories/__init__.py 작성
