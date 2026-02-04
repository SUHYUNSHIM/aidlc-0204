import type { MenuItem, CartItem, Order, CustomerSession } from '@/types/entities';

export function validateMenuItem(item: MenuItem): boolean {
  return (
    item.id !== '' &&
    item.name !== '' &&
    item.price > 0 &&
    item.categoryId !== ''
  );
}

export function validateCartItem(item: CartItem): boolean {
  return (
    item.menuId !== '' &&
    item.quantity >= 1 &&
    item.quantity <= 10 &&
    item.price > 0
  );
}

export function validateOrder(order: Order): boolean {
  return (
    order.items.length > 0 &&
    order.totalAmount > 0 &&
    order.tableId !== '' &&
    order.sessionId !== ''
  );
}

export function validateSession(session: CustomerSession): boolean {
  const now = new Date();
  const expiresAt = new Date(session.expiresAt);

  return (
    session.authToken !== '' &&
    session.isActive &&
    expiresAt > now
  );
}
