# Phase 3-1: Service 구현

## 목표

비즈니스 로직 Service 클래스 구현

---

## 1. services/auth_service.py

```python
from datetime import timedelta
from uuid import UUID
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import NotFoundException, AuthenticationError
from app.repositories import StoreRepository, TableRepository, SessionRepository
from app.models import TableSession


class AuthService:
    def __init__(
        self,
        store_repo: StoreRepository,
        table_repo: TableRepository,
        session_repo: SessionRepository
    ):
        self.store_repo = store_repo
        self.table_repo = table_repo
        self.session_repo = session_repo
    
    async def authenticate_table(
        self, store_id: int, table_number: int, table_password: str
    ) -> dict:
        # 1. 매장 확인
        store = await self.store_repo.get_by_id(store_id)
        if not store:
            raise NotFoundException("Store not found")
        
        # 2. 테이블 조회
        table = await self.table_repo.get_by_store_and_number(store_id, table_number)
        if not table:
            raise NotFoundException("Table not found")
        
        # 3. 비밀번호 검증
        if not verify_password(table_password, table.table_password_hash):
            raise AuthenticationError("Invalid credentials")
        
        # 4. 세션 확인/생성
        session = None
        if table.current_session_id:
            session = await self.session_repo.get_by_id(table.current_session_id)
            if session and not session.is_active:
                session = None
        
        if not session:
            session = TableSession(table_id=table.table_id)
            session = await self.session_repo.create(session)
        
        # 5. JWT 토큰 생성
        token_data = {
            "sub": f"table_{table.table_id}",
            "user_type": "table",
            "store_id": store_id,
            "table_id": table.table_id,
            "table_number": table.table_number,
            "session_id": str(session.session_id),
        }
        access_token = create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 57600,
            "table_id": table.table_id,
            "table_number": table.table_number,
            "session_id": session.session_id,
            "store_id": store_id,
            "store_name": store.store_name,
        }
    
    async def authenticate_admin(self, username: str, password: str) -> dict:
        # 1. 사용자명으로 매장 조회
        store = await self.store_repo.get_by_admin_username(username)
        if not store:
            raise AuthenticationError("Invalid credentials")
        
        # 2. 비밀번호 검증
        if not verify_password(password, store.admin_password_hash):
            raise AuthenticationError("Invalid credentials")
        
        # 3. JWT 토큰 생성
        token_data = {
            "sub": username,
            "user_type": "admin",
            "store_id": store.store_id,
        }
        access_token = create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 57600,
            "store_id": store.store_id,
            "store_name": store.store_name,
            "username": username,
        }
```

---

## 2. services/menu_service.py

```python
from typing import Optional, List
from app.core.cache import get_cache_manager
from app.core.exceptions import NotFoundException, ForbiddenError, ValidationError
from app.repositories import MenuRepository, CategoryRepository
from app.models import Menu, Category


class MenuService:
    def __init__(
        self,
        menu_repo: MenuRepository,
        category_repo: CategoryRepository
    ):
        self.menu_repo = menu_repo
        self.category_repo = category_repo
        self.cache = get_cache_manager()
    
    async def get_menus_by_store(
        self, store_id: int, category_id: Optional[int] = None
    ) -> dict:
        # 캐시 확인
        cache_key = f"menu:{store_id}" if not category_id else f"menu:{store_id}:{category_id}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        # DB 조회
        categories = await self.category_repo.get_by_store(store_id)
        result = {"store_id": store_id, "categories": []}
        
        for cat in categories:
            if category_id and cat.category_id != category_id:
                continue
            
            menus = await self.menu_repo.get_by_category(cat.category_id)
            cat_data = {
                "category_id": cat.category_id,
                "category_name": cat.category_name,
                "display_order": cat.display_order,
                "menus": [
                    {
                        "menu_id": m.menu_id,
                        "menu_name": m.menu_name,
                        "price": m.price,
                        "description": m.description,
                        "image_base64": m.image_base64,
                        "display_order": m.display_order,
                    }
                    for m in menus
                ]
            }
            result["categories"].append(cat_data)
        
        # 캐시 저장
        self.cache.set(cache_key, result, ttl=3600)
        return result
    
    async def create_menu(self, store_id: int, menu_data: dict) -> Menu:
        # 카테고리 확인
        category = await self.category_repo.get_by_id(menu_data["category_id"])
        if not category:
            raise NotFoundException("Category not found")
        if category.store_id != store_id:
            raise ForbiddenError("Category does not belong to this store")
        
        # 메뉴 생성
        menu = Menu(
            store_id=store_id,
            category_id=menu_data["category_id"],
            menu_name=menu_data["menu_name"],
            price=menu_data["price"],
            description=menu_data.get("description"),
            image_base64=menu_data.get("image_base64"),
            display_order=menu_data.get("display_order", 0),
        )
        menu = await self.menu_repo.create(menu)
        
        # 캐시 무효화
        self.cache.invalidate_pattern(f"menu:{store_id}*")
        return menu
    
    async def update_menu(self, menu_id: int, store_id: int, menu_data: dict) -> Menu:
        menu = await self.menu_repo.get_by_id(menu_id)
        if not menu:
            raise NotFoundException("Menu not found")
        if menu.store_id != store_id:
            raise ForbiddenError("Menu does not belong to this store")
        
        # 부분 업데이트
        for key, value in menu_data.items():
            if value is not None and hasattr(menu, key):
                setattr(menu, key, value)
        
        menu = await self.menu_repo.update(menu)
        self.cache.invalidate_pattern(f"menu:{store_id}*")
        return menu
    
    async def delete_menu(self, menu_id: int, store_id: int) -> bool:
        menu = await self.menu_repo.get_by_id(menu_id)
        if not menu:
            raise NotFoundException("Menu not found")
        if menu.store_id != store_id:
            raise ForbiddenError("Menu does not belong to this store")
        
        await self.menu_repo.delete(menu_id)
        self.cache.invalidate_pattern(f"menu:{store_id}*")
        return True
```

---

## 3. services/order_service.py

```python
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.core.exceptions import NotFoundException, ValidationError, ConflictError, ForbiddenError
from app.repositories import OrderRepository, SessionRepository, MenuRepository, TableRepository
from app.models import Order, OrderItem
from app.services.sse_service import get_sse_service


class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        session_repo: SessionRepository,
        menu_repo: MenuRepository,
        table_repo: TableRepository
    ):
        self.order_repo = order_repo
        self.session_repo = session_repo
        self.menu_repo = menu_repo
        self.table_repo = table_repo
        self.sse_service = get_sse_service()
    
    async def create_order(
        self,
        session_id: UUID,
        table_id: int,
        store_id: int,
        items: List[dict]
    ) -> Order:
        # 1. 세션 유효성 검증
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise NotFoundException("Session not found")
        if not session.is_active:
            raise ConflictError("Session has ended")
        
        # 2. 메뉴 검증 및 가격 조회
        order_items = []
        total_amount = 0
        
        for item in items:
            menu = await self.menu_repo.get_by_id(item["menu_id"])
            if not menu:
                raise NotFoundException(f"Menu not found: {item['menu_id']}")
            if menu.store_id != store_id:
                raise ForbiddenError("Menu does not belong to this store")
            
            order_items.append({
                "menu_id": menu.menu_id,
                "menu_name": menu.menu_name,
                "quantity": item["quantity"],
                "unit_price": menu.price,
            })
            total_amount += item["quantity"] * menu.price
        
        # 3. 주문 생성
        order = Order(
            session_id=session_id,
            table_id=table_id,
            store_id=store_id,
            total_amount=total_amount,
            status="대기중",
        )
        
        for item_data in order_items:
            order_item = OrderItem(
                menu_id=item_data["menu_id"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
            )
            order.items.append(order_item)
        
        order = await self.order_repo.create(order)
        
        # 4. SSE 브로드캐스트
        table = await self.table_repo.get_by_id(table_id)
        await self.sse_service.broadcast_order_update(
            store_id,
            "order_created",
            {
                "order_id": order.order_id,
                "table_id": table_id,
                "table_number": table.table_number,
                "total_amount": total_amount,
                "status": "대기중",
                "order_time": order.order_time.isoformat(),
                "items": [
                    {
                        "menu_id": i["menu_id"],
                        "menu_name": i["menu_name"],
                        "quantity": i["quantity"],
                        "unit_price": i["unit_price"],
                        "subtotal": i["quantity"] * i["unit_price"],
                    }
                    for i in order_items
                ]
            }
        )
        
        return order
    
    async def get_orders_by_session(self, session_id: UUID) -> dict:
        orders = await self.order_repo.get_by_session(session_id)
        session = await self.session_repo.get_by_id(session_id)
        table = await self.table_repo.get_by_id(session.table_id)
        
        total = sum(o.total_amount for o in orders)
        
        return {
            "session_id": session_id,
            "table_number": table.table_number,
            "total_session_amount": total,
            "orders": orders,
        }
    
    async def update_order_status(
        self, order_id: int, new_status: str, store_id: int
    ) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        if order.store_id != store_id:
            raise ForbiddenError("Order does not belong to this store")
        
        if order.status == "완료":
            raise ValidationError("Cannot change status of completed order")
        
        order.status = new_status
        order = await self.order_repo.update(order)
        
        # SSE 브로드캐스트
        await self.sse_service.broadcast_order_update(
            store_id,
            "order_updated",
            {
                "order_id": order_id,
                "table_id": order.table_id,
                "status": new_status,
            }
        )
        
        return order
    
    async def delete_order(self, order_id: int, store_id: int) -> dict:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        if order.store_id != store_id:
            raise ForbiddenError("Order does not belong to this store")
        
        table_id = order.table_id
        await self.order_repo.delete(order_id)
        
        # SSE 브로드캐스트
        await self.sse_service.broadcast_order_update(
            store_id,
            "order_deleted",
            {"order_id": order_id, "table_id": table_id}
        )
        
        return {"order_id": order_id, "table_id": table_id}
```

---

## 4. services/table_service.py

```python
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.core.security import hash_password
from app.core.exceptions import NotFoundException, ConflictError, ForbiddenError
from app.repositories import TableRepository, SessionRepository, OrderRepository, HistoryRepository
from app.models import Table, TableSession, OrderHistory
from app.services.sse_service import get_sse_service


class TableService:
    def __init__(
        self,
        table_repo: TableRepository,
        session_repo: SessionRepository,
        order_repo: OrderRepository,
        history_repo: HistoryRepository
    ):
        self.table_repo = table_repo
        self.session_repo = session_repo
        self.order_repo = order_repo
        self.history_repo = history_repo
        self.sse_service = get_sse_service()
    
    async def create_table(
        self, store_id: int, table_number: int, table_password: str
    ) -> Table:
        # 중복 확인
        existing = await self.table_repo.get_by_store_and_number(store_id, table_number)
        if existing:
            raise ConflictError("Table number already exists")
        
        table = Table(
            store_id=store_id,
            table_number=table_number,
            table_password_hash=hash_password(table_password),
        )
        return await self.table_repo.create(table)
    
    async def end_session(self, table_id: int, store_id: int) -> dict:
        # 1. 테이블 및 세션 확인
        table = await self.table_repo.get_by_id(table_id)
        if not table:
            raise NotFoundException("Table not found")
        if table.store_id != store_id:
            raise ForbiddenError("Table does not belong to this store")
        if not table.current_session_id:
            raise ConflictError("No active session")
        
        session = await self.session_repo.get_by_id(table.current_session_id)
        if not session or not session.is_active:
            raise ConflictError("Session already ended")
        
        # 2. 주문 데이터 아카이브
        orders = await self.order_repo.get_by_session(session.session_id)
        
        order_data = {"orders": [], "session_total": 0}
        for order in orders:
            order_dict = {
                "order_id": order.order_id,
                "order_time": order.order_time.isoformat(),
                "total_amount": order.total_amount,
                "status": order.status,
                "items": [
                    {
                        "menu_id": item.menu_id,
                        "quantity": item.quantity,
                        "unit_price": item.unit_price,
                    }
                    for item in order.items
                ]
            }
            order_data["orders"].append(order_dict)
            order_data["session_total"] += order.total_amount
        
        # 3. OrderHistory 저장
        history = OrderHistory(
            session_id=session.session_id,
            table_id=table_id,
            store_id=store_id,
            archived_order_data=order_data,
        )
        await self.history_repo.create(history)
        
        # 4. 세션 종료 (트리거가 table.current_session_id 자동 초기화)
        session.is_active = False
        session.end_time = datetime.utcnow()
        await self.session_repo.update(session)
        
        # 5. SSE 브로드캐스트
        await self.sse_service.broadcast_order_update(
            store_id,
            "session_ended",
            {
                "table_id": table_id,
                "table_number": table.table_number,
                "session_id": str(session.session_id),
            }
        )
        
        return {
            "message": "Session ended successfully",
            "table_id": table_id,
            "table_number": table.table_number,
            "session_id": session.session_id,
            "total_session_amount": order_data["session_total"],
            "order_count": len(orders),
        }
```

---

## 5. services/__init__.py

```python
from app.services.auth_service import AuthService
from app.services.menu_service import MenuService
from app.services.order_service import OrderService
from app.services.table_service import TableService

__all__ = [
    "AuthService",
    "MenuService",
    "OrderService",
    "TableService",
]
```

---

## 체크리스트

- [ ] services/auth_service.py 구현
- [ ] services/menu_service.py 구현
- [ ] services/order_service.py 구현
- [ ] services/table_service.py 구현
- [ ] services/__init__.py 작성
