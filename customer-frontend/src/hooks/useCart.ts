import { useContext, useMemo } from 'react';
import { CartContext } from '@/contexts/CartContext';
import type { Cart, MenuItem } from '@/types/entities';
import { calculateCartTotals } from '@/services/cartService';

interface UseCartReturn {
  cart: Cart;
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  clearCart: () => void;
  totals: { totalItems: number; totalAmount: number };
}

export function useCart(): UseCartReturn {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  const totals = useMemo(() => calculateCartTotals(context.cart), [context.cart]);

  return {
    ...context,
    totals,
  };
}
