# Phase 4-1: API 엔드포인트

## 목표

FastAPI 라우터 및 엔드포인트 구현

---

## 1. api/v1/endpoints/auth.py

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas import (
    TableLoginRequest, TableLoginResponse,
    AdminLoginRequest, AdminLoginResponse,
)
from app.services import AuthService
from app.repositories import StoreRepository, TableRepository, SessionRepository

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(
        StoreRepository(db),
        TableRepository(db),
        SessionRepository(db),
    )


@router.post("/table/login", response_model=TableLoginResponse)
async def table_login(
    request: TableLoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """테이블 로그인"""
    return await auth_service.authenticate_table(
        request.store_id,
        request.table_number,
        request.table_password,
    )


@router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(
    request: AdminLoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """관리자 로그인"""
    return await auth_service.authenticate_admin(
        request.username,
        request.password,
    )
```

---

## 2. api/v1/endpoints/customer.py

```python
from fastapi import APIRouter, Depends
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_table
from app.schemas import (
    MenuListResponse,
    OrderCreate, OrderResponse,
    CustomerOrdersResponse,
)
from app.services import MenuService, OrderService
from app.repositories import (
    MenuRepository, CategoryRepository,
    OrderRepository, SessionRepository, TableRepository,
)

router = APIRouter(prefix="/customer", tags=["Customer"])


def get_menu_service(db: AsyncSession = Depends(get_db)) -> MenuService:
    return MenuService(MenuRepository(db), CategoryRepository(db))


def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    return OrderService(
        OrderRepository(db),
        SessionRepository(db),
        MenuRepository(db),
        TableRepository(db),
    )


@router.get("/menus", response_model=MenuListResponse)
async def get_menus(
    category_id: Optional[int] = None,
    current_table: dict = Depends(get_current_table),
    menu_service: MenuService = Depends(get_menu_service)
):
    """메뉴 목록 조회"""
    return await menu_service.get_menus_by_store(
        current_table["store_id"],
        category_id,
    )


@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    request: OrderCreate,
    current_table: dict = Depends(get_current_table),
    order_service: OrderService = Depends(get_order_service)
):
    """주문 생성"""
    order = await order_service.create_order(
        UUID(current_table["session_id"]),
        current_table["table_id"],
        current_table["store_id"],
        [item.model_dump() for item in request.items],
    )
    
    # 응답 변환
    table_number = current_table["table_number"]
    return {
        "order_id": order.order_id,
        "table_id": order.table_id,
        "table_number": table_number,
        "session_id": order.session_id,
        "total_amount": order.total_amount,
        "status": order.status,
        "order_time": order.order_time,
        "items": [
            {
                "order_item_id": item.order_item_id,
                "menu_id": item.menu_id,
                "menu_name": item.menu.menu_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ]
    }


@router.get("/orders", response_model=CustomerOrdersResponse)
async def get_my_orders(
    current_table: dict = Depends(get_current_table),
    order_service: OrderService = Depends(get_order_service)
):
    """내 주문 내역 조회"""
    return await order_service.get_orders_by_session(
        UUID(current_table["session_id"])
    )
```

---

## 3. api/v1/endpoints/admin.py

```python
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.schemas import (
    AdminOrdersResponse,
    OrderStatusUpdate, OrderStatusResponse, OrderDeleteResponse,
    TableCreate, TableResponse, SessionEndResponse,
    TableHistoryResponse,
    MenuListResponse, MenuCreate, MenuUpdate, MenuResponse,
)
from app.services import OrderService, TableService, MenuService
from app.services.sse_service import get_sse_service
from app.repositories import (
    OrderRepository, SessionRepository, MenuRepository, TableRepository,
    CategoryRepository, HistoryRepository,
)
import asyncio
import json

router = APIRouter(prefix="/admin", tags=["Admin"])


# 의존성 함수들
def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    return OrderService(
        OrderRepository(db),
        SessionRepository(db),
        MenuRepository(db),
        TableRepository(db),
    )


def get_table_service(db: AsyncSession = Depends(get_db)) -> TableService:
    return TableService(
        TableRepository(db),
        SessionRepository(db),
        OrderRepository(db),
        HistoryRepository(db),
    )


def get_menu_service(db: AsyncSession = Depends(get_db)) -> MenuService:
    return MenuService(MenuRepository(db), CategoryRepository(db))


# 주문 관리
@router.get("/orders", response_model=AdminOrdersResponse)
async def get_orders(
    status: Optional[str] = None,
    table_id: Optional[int] = None,
    current_admin: dict = Depends(get_current_admin),
    order_service: OrderService = Depends(get_order_service)
):
    """주문 목록 조회"""
    # 구현 필요
    pass


@router.patch("/orders/{order_id}/status", response_model=OrderStatusResponse)
async def update_order_status(
    order_id: int,
    request: OrderStatusUpdate,
    current_admin: dict = Depends(get_current_admin),
    order_service: OrderService = Depends(get_order_service)
):
    """주문 상태 변경"""
    order = await order_service.update_order_status(
        order_id,
        request.status,
        current_admin["store_id"],
    )
    return {"order_id": order.order_id, "status": order.status}


@router.delete("/orders/{order_id}", response_model=OrderDeleteResponse)
async def delete_order(
    order_id: int,
    current_admin: dict = Depends(get_current_admin),
    order_service: OrderService = Depends(get_order_service)
):
    """주문 삭제"""
    result = await order_service.delete_order(order_id, current_admin["store_id"])
    return {
        "message": "Order deleted successfully",
        "order_id": result["order_id"],
        "table_id": result["table_id"],
    }


# SSE 스트림
async def event_generator(store_id: int, connection_id: str, queue: asyncio.Queue):
    sse_service = get_sse_service()
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                event_type = event["event"]
                data = json.dumps(event["data"], ensure_ascii=False, default=str)
                yield f"event: {event_type}\ndata: {data}\n\n"
            except asyncio.TimeoutError:
                yield ": ping\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        sse_service.unregister_connection(connection_id)


@router.get("/orders/sse")
async def order_stream(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """실시간 주문 업데이트 SSE"""
    store_id = current_admin["store_id"]
    sse_service = get_sse_service()
    
    connection_id, queue = await sse_service.register_connection(store_id)
    
    # 초기 데이터 전송
    order_service = get_order_service(db)
    # initial_data = await order_service.get_orders_by_store(store_id)
    # await sse_service.send_initial_data(connection_id, initial_data)
    
    return StreamingResponse(
        event_generator(store_id, connection_id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# 테이블 관리
@router.post("/tables", response_model=TableResponse, status_code=201)
async def create_table(
    request: TableCreate,
    current_admin: dict = Depends(get_current_admin),
    table_service: TableService = Depends(get_table_service)
):
    """테이블 생성"""
    table = await table_service.create_table(
        current_admin["store_id"],
        request.table_number,
        request.table_password,
    )
    return table


@router.post("/tables/{table_id}/end-session", response_model=SessionEndResponse)
async def end_table_session(
    table_id: int,
    current_admin: dict = Depends(get_current_admin),
    table_service: TableService = Depends(get_table_service)
):
    """테이블 세션 종료"""
    return await table_service.end_session(table_id, current_admin["store_id"])


@router.get("/tables/{table_id}/history", response_model=TableHistoryResponse)
async def get_table_history(
    table_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """테이블 과거 내역 조회"""
    # 구현 필요
    pass


# 메뉴 관리
@router.get("/menus", response_model=MenuListResponse)
async def get_menus(
    category_id: Optional[int] = None,
    current_admin: dict = Depends(get_current_admin),
    menu_service: MenuService = Depends(get_menu_service)
):
    """메뉴 목록 조회"""
    return await menu_service.get_menus_by_store(
        current_admin["store_id"],
        category_id,
    )


@router.post("/menus", response_model=MenuResponse, status_code=201)
async def create_menu(
    request: MenuCreate,
    current_admin: dict = Depends(get_current_admin),
    menu_service: MenuService = Depends(get_menu_service)
):
    """메뉴 생성"""
    menu = await menu_service.create_menu(
        current_admin["store_id"],
        request.model_dump(),
    )
    return menu


@router.patch("/menus/{menu_id}", response_model=MenuResponse)
async def update_menu(
    menu_id: int,
    request: MenuUpdate,
    current_admin: dict = Depends(get_current_admin),
    menu_service: MenuService = Depends(get_menu_service)
):
    """메뉴 수정"""
    menu = await menu_service.update_menu(
        menu_id,
        current_admin["store_id"],
        request.model_dump(exclude_unset=True),
    )
    return menu


@router.delete("/menus/{menu_id}")
async def delete_menu(
    menu_id: int,
    current_admin: dict = Depends(get_current_admin),
    menu_service: MenuService = Depends(get_menu_service)
):
    """메뉴 삭제"""
    await menu_service.delete_menu(menu_id, current_admin["store_id"])
    return {"message": "Menu deleted successfully", "menu_id": menu_id}
```

---

## 4. api/v1/endpoints/health.py

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """기본 헬스 체크"""
    return {"status": "healthy"}


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """준비 상태 체크 (DB 연결 포함)"""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "checks": {"database": "connected"}
        }
    except Exception as e:
        return {
            "status": "not_ready",
            "checks": {"database": f"error: {str(e)}"}
        }


@router.get("/health/live")
async def liveness_check():
    """생존 상태 체크"""
    return {"status": "alive"}
```

---

## 5. api/v1/router.py

```python
from fastapi import APIRouter
from app.api.v1.endpoints import auth, customer, admin, health

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(customer.router)
api_router.include_router(admin.router)
api_router.include_router(health.router)
```

---

## 체크리스트

- [ ] api/v1/endpoints/auth.py 구현
- [ ] api/v1/endpoints/customer.py 구현
- [ ] api/v1/endpoints/admin.py 구현
- [ ] api/v1/endpoints/health.py 구현
- [ ] api/v1/router.py 구현
- [ ] api/v1/__init__.py 작성
- [ ] api/__init__.py 작성
