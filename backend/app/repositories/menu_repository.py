from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Menu


class MenuRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, menu_id: int) -> Optional[Menu]:
        result = await self.db.execute(
            select(Menu).where(Menu.menu_id == menu_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_store(self, store_id: int) -> List[Menu]:
        result = await self.db.execute(
            select(Menu)
            .where(Menu.store_id == store_id)
            .order_by(Menu.display_order)
        )
        return list(result.scalars().all())
    
    async def get_by_category(self, category_id: int) -> List[Menu]:
        result = await self.db.execute(
            select(Menu)
            .where(Menu.category_id == category_id)
            .order_by(Menu.display_order)
        )
        return list(result.scalars().all())
    
    async def create(self, menu: Menu) -> Menu:
        self.db.add(menu)
        await self.db.commit()
        await self.db.refresh(menu)
        return menu
    
    async def update(self, menu: Menu) -> Menu:
        await self.db.commit()
        await self.db.refresh(menu)
        return menu
    
    async def delete(self, menu_id: int) -> bool:
        menu = await self.get_by_id(menu_id)
        if menu:
            await self.db.delete(menu)
            await self.db.commit()
            return True
        return False
