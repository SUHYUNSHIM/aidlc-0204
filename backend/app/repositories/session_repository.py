from typing import Optional
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
