from typing import Optional
from app.core.cache import get_cache_manager
from app.core.exceptions import NotFoundException, ForbiddenError
from app.repositories import MenuRepository, CategoryRepository
from app.models import Menu


class MenuService:
    def __init__(
        self,
        menu_repo: MenuRepository,
        category_repo: CategoryRepository
    ):
        self.menu_repo = menu_repo
        self.category_repo = category_repo
        self.cache = get_cache_manager()
    
    async def get_menus_by_store(
        self, store_id: int, category_id: Optional[int] = None
    ) -> dict:
        # 캐시 확인
        cache_key = f"menu:{store_id}" if not category_id else f"menu:{store_id}:{category_id}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached
        
        # DB 조회
        categories = await self.category_repo.get_by_store(store_id)
        result = {"store_id": store_id, "categories": []}
        
        for cat in categories:
            if category_id and cat.category_id != category_id:
                continue
            
            menus = await self.menu_repo.get_by_category(cat.category_id)
            cat_data = {
                "category_id": cat.category_id,
                "category_name": cat.category_name,
                "display_order": cat.display_order,
                "menus": [
                    {
                        "menu_id": m.menu_id,
                        "menu_name": m.menu_name,
                        "price": m.price,
                        "description": m.description,
                        "image_base64": m.image_base64,
                        "display_order": m.display_order,
                    }
                    for m in menus
                ]
            }
            result["categories"].append(cat_data)
        
        # 캐시 저장
        self.cache.set(cache_key, result, ttl=3600)
        return result
    
    async def create_menu(self, store_id: int, menu_data: dict) -> Menu:
        # 카테고리 확인
        category = await self.category_repo.get_by_id(menu_data["category_id"])
        if not category:
            raise NotFoundException("Category not found")
        if category.store_id != store_id:
            raise ForbiddenError("Category does not belong to this store")
        
        # 메뉴 생성
        menu = Menu(
            store_id=store_id,
            category_id=menu_data["category_id"],
            menu_name=menu_data["menu_name"],
            price=menu_data["price"],
            description=menu_data.get("description"),
            image_base64=menu_data.get("image_base64"),
            display_order=menu_data.get("display_order", 0),
        )
        menu = await self.menu_repo.create(menu)
        
        # 캐시 무효화
        self.cache.invalidate_pattern(f"menu:{store_id}*")
        return menu
    
    async def update_menu(self, menu_id: int, store_id: int, menu_data: dict) -> Menu:
        menu = await self.menu_repo.get_by_id(menu_id)
        if not menu:
            raise NotFoundException("Menu not found")
        if menu.store_id != store_id:
            raise ForbiddenError("Menu does not belong to this store")
        
        # 부분 업데이트
        for key, value in menu_data.items():
            if value is not None and hasattr(menu, key):
                setattr(menu, key, value)
        
        menu = await self.menu_repo.update(menu)
        self.cache.invalidate_pattern(f"menu:{store_id}*")
        return menu
    
    async def delete_menu(self, menu_id: int, store_id: int) -> bool:
        menu = await self.menu_repo.get_by_id(menu_id)
        if not menu:
            raise NotFoundException("Menu not found")
        if menu.store_id != store_id:
            raise ForbiddenError("Menu does not belong to this store")
        
        await self.menu_repo.delete(menu_id)
        self.cache.invalidate_pattern(f"menu:{store_id}*")
        return True
