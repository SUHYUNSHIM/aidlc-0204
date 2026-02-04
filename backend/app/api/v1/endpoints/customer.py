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
    order_service: OrderService = Depends(get_order_service),
    db: AsyncSession = Depends(get_db)
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
                "menu_name": item.menu.menu_name if item.menu else "Unknown",
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
    result = await order_service.get_orders_by_session(
        UUID(current_table["session_id"])
    )
    
    # 응답 변환
    return {
        "session_id": result["session_id"],
        "table_number": result["table_number"],
        "total_session_amount": result["total_session_amount"],
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
            for o in result["orders"]
        ]
    }
