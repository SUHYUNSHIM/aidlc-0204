from datetime import datetime
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
