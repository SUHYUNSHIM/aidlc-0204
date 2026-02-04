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
