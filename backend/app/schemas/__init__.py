from app.schemas.common import MessageResponse, ErrorResponse
from app.schemas.auth import (
    TableLoginRequest, TableLoginResponse,
    AdminLoginRequest, AdminLoginResponse,
)
from app.schemas.menu import (
    MenuItemResponse, CategoryResponse, MenuListResponse,
    MenuCreate, MenuUpdate, MenuResponse,
    CategoryCreate, CategoryUpdate, CategoryBriefResponse,
)
from app.schemas.order import (
    OrderItemCreate, OrderCreate,
    OrderItemResponse, OrderResponse, OrderBriefResponse,
    CustomerOrdersResponse, TableOrdersResponse, AdminOrdersResponse,
    OrderStatusUpdate, OrderStatusResponse, OrderDeleteResponse,
)
from app.schemas.table import (
    TableCreate, TableResponse,
    SessionEndResponse, OrderHistoryItem, TableHistoryResponse,
)

__all__ = [
    # Common
    "MessageResponse", "ErrorResponse",
    # Auth
    "TableLoginRequest", "TableLoginResponse",
    "AdminLoginRequest", "AdminLoginResponse",
    # Menu
    "MenuItemResponse", "CategoryResponse", "MenuListResponse",
    "MenuCreate", "MenuUpdate", "MenuResponse",
    "CategoryCreate", "CategoryUpdate", "CategoryBriefResponse",
    # Order
    "OrderItemCreate", "OrderCreate",
    "OrderItemResponse", "OrderResponse", "OrderBriefResponse",
    "CustomerOrdersResponse", "TableOrdersResponse", "AdminOrdersResponse",
    "OrderStatusUpdate", "OrderStatusResponse", "OrderDeleteResponse",
    # Table
    "TableCreate", "TableResponse",
    "SessionEndResponse", "OrderHistoryItem", "TableHistoryResponse",
]
