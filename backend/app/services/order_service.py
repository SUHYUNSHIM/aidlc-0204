from typing import List
from uuid import UUID
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
            items=[
                OrderItem(
                    menu_id=item_data["menu_id"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                )
                for item_data in order_items
            ]
        )
        
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
