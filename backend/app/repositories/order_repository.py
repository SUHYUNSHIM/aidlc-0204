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
            .options(selectinload(Order.items).selectinload(OrderItem.menu))
            .where(Order.order_id == order_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_session(self, session_id: UUID) -> List[Order]:
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.menu))
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
            .options(selectinload(Order.items).selectinload(OrderItem.menu))
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
        # Reload with relationships
        return await self.get_by_id(order.order_id)
    
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
