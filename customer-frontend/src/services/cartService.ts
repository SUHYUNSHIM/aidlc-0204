import type { Cart, CartItem, MenuItem } from '@/types/entities';
import { menuItemToCartItem } from '@/transformers/entityTransformers';

export function addToCartLogic(cart: Cart, item: MenuItem, quantity: number): Cart {
  // 메뉴 가용성 검증
  if (!item.isAvailable) {
    throw new Error('품절된 메뉴입니다');
  }

  // 기존 항목 찾기
  const existingItemIndex = cart.items.findIndex((cartItem) => cartItem.menuId === item.id);

  let updatedItems: CartItem[];

  if (existingItemIndex >= 0) {
    // 기존 항목 수량 증가
    const existingItem = cart.items[existingItemIndex];
    const newQuantity = existingItem.quantity + quantity;

    // 최대 수량 검증
    if (newQuantity > 10) {
      throw new Error('최대 수량은 10개입니다');
    }

    updatedItems = [...cart.items];
    updatedItems[existingItemIndex] = {
      ...existingItem,
      quantity: newQuantity,
    };
  } else {
    // 새 항목 추가
    const newItem = menuItemToCartItem(item, quantity);
    updatedItems = [...cart.items, newItem];
  }

  return {
    items: updatedItems,
    lastUpdated: new Date().toISOString(),
  };
}

export function removeFromCartLogic(cart: Cart, menuId: string): Cart {
  const updatedItems = cart.items.filter((item) => item.menuId !== menuId);

  return {
    items: updatedItems,
    lastUpdated: new Date().toISOString(),
  };
}

export function updateQuantityLogic(cart: Cart, menuId: string, delta: number): Cart {
  const itemIndex = cart.items.findIndex((item) => item.menuId === menuId);

  if (itemIndex < 0) {
    throw new Error('항목을 찾을 수 없습니다');
  }

  const item = cart.items[itemIndex];
  const newQuantity = item.quantity + delta;

  let updatedItems: CartItem[];

  if (newQuantity <= 0) {
    // 수량이 0 이하면 항목 제거
    updatedItems = cart.items.filter((_, index) => index !== itemIndex);
  } else if (newQuantity > 10) {
    // 최대 수량 초과
    throw new Error('최대 수량은 10개입니다');
  } else {
    // 수량 업데이트
    updatedItems = [...cart.items];
    updatedItems[itemIndex] = {
      ...item,
      quantity: newQuantity,
    };
  }

  return {
    items: updatedItems,
    lastUpdated: new Date().toISOString(),
  };
}

export function clearCartLogic(): Cart {
  return {
    items: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function calculateCartTotals(cart: Cart): { totalItems: number; totalAmount: number } {
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { totalItems, totalAmount };
}

export function saveCartToLocalStorage(cart: Cart, sessionId?: string): void {
  try {
    const key = sessionId ? `customer_cart_${sessionId}` : 'customer_cart';
    localStorage.setItem(key, JSON.stringify(cart));
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      // 가장 오래된 항목 제거
      const sortedItems = [...cart.items].sort(
        (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
      );

      if (sortedItems.length > 0) {
        const updatedCart: Cart = {
          items: sortedItems.slice(1), // 첫 번째 항목 제거
          lastUpdated: new Date().toISOString(),
        };

        // 재시도
        const key = sessionId ? `customer_cart_${sessionId}` : 'customer_cart';
        localStorage.setItem(key, JSON.stringify(updatedCart));
      }
    } else {
      throw error;
    }
  }
}

export function loadCartFromLocalStorage(sessionId?: string): Cart | null {
  const key = sessionId ? `customer_cart_${sessionId}` : 'customer_cart';
  const saved = localStorage.getItem(key);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function clearCartFromLocalStorage(sessionId?: string): void {
  const key = sessionId ? `customer_cart_${sessionId}` : 'customer_cart';
  localStorage.removeItem(key);
}
