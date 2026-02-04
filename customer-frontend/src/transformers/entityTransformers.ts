import type { MenuItem, CartItem, OrderItem, Order, OrderStatus } from '@/types/entities';

export function menuItemToCartItem(menuItem: MenuItem, quantity: number = 1): CartItem {
  return {
    menuId: menuItem.id,
    name: menuItem.name,
    price: menuItem.price,
    quantity: quantity,
    imageUrl: menuItem.imageUrl,
    addedAt: new Date().toISOString(),
  };
}

export function cartItemToOrderItem(cartItem: CartItem, currentPrice: number): OrderItem {
  return {
    menuId: cartItem.menuId,
    name: cartItem.name,
    price: currentPrice,
    quantity: cartItem.quantity,
    subtotal: currentPrice * cartItem.quantity,
  };
}

export function apiMenuToMenuItem(apiMenu: any, category?: any): MenuItem {
  return {
    id: apiMenu.menu_id.toString(),
    name: apiMenu.menu_name,
    price: apiMenu.price,
    description: apiMenu.description || '',
    imageUrl: apiMenu.image_base64,
    categoryId: category ? category.category_id.toString() : apiMenu.category_id?.toString() || '',
    categoryName: category ? category.category_name : apiMenu.category_name || '',
    displayOrder: apiMenu.display_order,
    isAvailable: true, // Backend에서 제공하지 않으므로 기본값 true
  };
}

export function apiOrderToOrder(apiOrder: any): Order {
  // Backend 상태를 Frontend OrderStatus로 매핑
  const statusMap: Record<string, OrderStatus> = {
    '대기중': 'pending' as OrderStatus,
    '준비중': 'preparing' as OrderStatus,
    '완료': 'completed' as OrderStatus,
  };

  return {
    orderId: apiOrder.order_id.toString(),
    tableId: apiOrder.table_id.toString(),
    sessionId: apiOrder.session_id,
    items: apiOrder.items.map((item: any) => ({
      menuId: item.menu_id.toString(),
      name: item.menu_name,
      price: item.unit_price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    totalAmount: apiOrder.total_amount,
    status: statusMap[apiOrder.status] || 'pending' as OrderStatus,
    createdAt: apiOrder.order_time,
    estimatedPrepTime: 15, // Backend에서 제공하지 않으므로 기본값
  };
}
