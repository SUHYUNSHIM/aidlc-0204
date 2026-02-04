from typing import Optional, List
from datetime import date
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
