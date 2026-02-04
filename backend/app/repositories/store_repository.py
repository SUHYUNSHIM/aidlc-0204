from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Store


class StoreRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, store_id: int) -> Optional[Store]:
        result = await self.db.execute(
            select(Store).where(Store.store_id == store_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_admin_username(self, username: str) -> Optional[Store]:
        result = await self.db.execute(
            select(Store).where(Store.admin_username == username)
        )
        return result.scalar_one_or_none()
    
    async def create(self, store: Store) -> Store:
        self.db.add(store)
        await self.db.commit()
        await self.db.refresh(store)
        return store
