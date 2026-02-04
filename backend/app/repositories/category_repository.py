from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Category, Menu


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, category_id: int) -> Optional[Category]:
        result = await self.db.execute(
            select(Category).where(Category.category_id == category_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_store(self, store_id: int) -> List[Category]:
        result = await self.db.execute(
            select(Category)
            .where(Category.store_id == store_id)
            .order_by(Category.display_order)
        )
        return list(result.scalars().all())
    
    async def create(self, category: Category) -> Category:
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category
    
    async def update(self, category: Category) -> Category:
        await self.db.commit()
        await self.db.refresh(category)
        return category
    
    async def delete(self, category_id: int) -> bool:
        category = await self.get_by_id(category_id)
        if category:
            await self.db.delete(category)
            await self.db.commit()
            return True
        return False
    
    async def count_menus(self, category_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Menu.menu_id))
            .where(Menu.category_id == category_id)
        )
        return result.scalar() or 0
