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
    db: AsyncSession = Depends(get_db)
):
    """주문 목록 조회"""
    store_id = current_admin["store_id"]
    order_repo = OrderRepository(db)
    table_repo = TableRepository(db)
    
    # 테이블별 주문 조회
    tables = await table_repo.get_all_by_store(store_id)
    result_tables = []
    
    for table in tables:
        if table_id and table.table_id != table_id:
            continue
        
        if not table.current_session_id:
            continue
        
        orders = await order_repo.get_by_session(table.current_session_id)
        if status:
            orders = [o for o in orders if o.status == status]
        
        total = sum(o.total_amount for o in orders)
        
        result_tables.append({
            "table_id": table.table_id,
            "table_number": table.table_number,
            "session_id": table.current_session_id,
            "total_amount": total,
            "order_count": len(orders),
            "orders": [
                {
                    "order_id": o.order_id,
                    "total_amount": o.total_amount,
                    "status": o.status,
                    "order_time": o.order_time,
                    "items": [
                        {
                            "order_item_id": item.order_item_id,
                            "menu_id": item.menu_id,
                            "menu_name": item.menu.menu_name if item.menu else "Unknown",
                            "quantity": item.quantity,
                            "unit_price": item.unit_price,
                            "subtotal": item.subtotal,
                        }
                        for item in o.items
                    ]
                }
                for o in orders
            ]
        })
    
    return {"store_id": store_id, "tables": result_tables}


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
):
    """실시간 주문 업데이트 SSE"""
    store_id = current_admin["store_id"]
    sse_service = get_sse_service()
    
    connection_id, queue = await sse_service.register_connection(store_id)
    
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
@router.get("/tables")
async def get_all_tables(
    current_admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """모든 테이블 조회"""
    store_id = current_admin["store_id"]
    table_repo = TableRepository(db)
    
    tables = await table_repo.get_all_by_store(store_id)
    
    return {
        "store_id": store_id,
        "tables": [
            {
                "table_id": t.table_id,
                "table_number": t.table_number,
                "current_session_id": t.current_session_id,
                "is_active": t.current_session_id is not None,
            }
            for t in tables
        ]
    }


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
    table_repo = TableRepository(db)
    history_repo = HistoryRepository(db)
    
    table = await table_repo.get_by_id(table_id)
    if not table or table.store_id != current_admin["store_id"]:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Table not found")
    
    history = await history_repo.get_by_table(
        table_id, start_date, end_date, limit, offset
    )
    total_count = await history_repo.count_by_table(table_id, start_date, end_date)
    
    return {
        "table_id": table_id,
        "table_number": table.table_number,
        "total_count": total_count,
        "history": history,
    }


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
