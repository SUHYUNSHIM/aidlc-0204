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

export function apiMenuToMenuItem(apiMenu: any): MenuItem {
  return {
    id: apiMenu.id,
    name: apiMenu.name,
    price: apiMenu.price,
    description: apiMenu.description,
    imageUrl: apiMenu.image_url,
    categoryId: apiMenu.category_id,
    categoryName: apiMenu.category_name,
    displayOrder: apiMenu.display_order,
    isAvailable: apiMenu.is_available,
  };
}

export function apiOrderToOrder(apiOrder: any): Order {
  return {
    orderId: apiOrder.order_id,
    tableId: apiOrder.table_id,
    sessionId: apiOrder.session_id,
    items: apiOrder.items,
    totalAmount: apiOrder.total_amount,
    status: apiOrder.status as OrderStatus,
    createdAt: apiOrder.created_at,
    estimatedPrepTime: apiOrder.estimated_prep_time,
  };
}
