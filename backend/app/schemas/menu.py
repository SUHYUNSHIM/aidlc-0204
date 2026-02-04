from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MenuItemResponse(BaseModel):
    menu_id: int
    menu_name: str
    price: int
    description: Optional[str] = None
    image_base64: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    category_id: int
    category_name: str
    display_order: int
    menus: List[MenuItemResponse]

    class Config:
        from_attributes = True


class MenuListResponse(BaseModel):
    store_id: int
    categories: List[CategoryResponse]


class MenuCreate(BaseModel):
    category_id: int = Field(..., description="카테고리 ID")
    menu_name: str = Field(..., min_length=1, max_length=100)
    price: int = Field(..., gt=0, description="가격 (원)")
    description: Optional[str] = Field(None, max_length=500)
    image_base64: Optional[str] = None
    display_order: Optional[int] = Field(0, ge=0)


class MenuUpdate(BaseModel):
    category_id: Optional[int] = None
    menu_name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[int] = Field(None, gt=0)
    description: Optional[str] = Field(None, max_length=500)
    image_base64: Optional[str] = None
    display_order: Optional[int] = Field(None, ge=0)


class MenuResponse(BaseModel):
    menu_id: int
    menu_name: str
    price: int
    category_id: int
    category_name: Optional[str] = None
    description: Optional[str] = None
    image_base64: Optional[str] = None
    display_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    category_name: str = Field(..., min_length=1, max_length=50)
    display_order: Optional[int] = Field(0, ge=0)


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = Field(None, min_length=1, max_length=50)
    display_order: Optional[int] = Field(None, ge=0)


class CategoryBriefResponse(BaseModel):
    category_id: int
    category_name: str
    display_order: int
    menu_count: int

    class Config:
        from_attributes = True
