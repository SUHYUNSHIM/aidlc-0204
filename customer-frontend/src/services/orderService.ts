import type { Cart, CustomerSession, MenuItem, OrderItem, ValidationResult } from '@/types/entities';
import { validateSession } from '@/utils/validation';
import { cartItemToOrderItem } from '@/transformers/entityTransformers';

export function validateOrderSubmission(cart: Cart, session: CustomerSession): ValidationResult {
  // 장바구니 비어있음 검증
  if (cart.items.length === 0) {
    return { valid: false, error: '장바구니가 비어있습니다' };
  }

  // 세션 유효성 검증
  if (!validateSession(session)) {
    return { valid: false, error: '세션이 만료되었습니다' };
  }

  // 항목 수량 검증
  for (const item of cart.items) {
    if (item.quantity < 1 || item.quantity > 10) {
      return { valid: false, error: '유효하지 않은 수량입니다' };
    }
  }

  return { valid: true };
}

export function prepareOrderItems(cart: Cart, currentMenus: MenuItem[]): OrderItem[] {
  return cart.items.map((cartItem) => {
    const currentMenu = currentMenus.find((m) => m.id === cartItem.menuId);
    const currentPrice = currentMenu?.price || cartItem.price;

    return cartItemToOrderItem(cartItem, currentPrice);
  });
}

export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}
