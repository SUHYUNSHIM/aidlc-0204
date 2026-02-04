import { createContext, ReactNode, useState, useEffect } from 'react';
import type { Cart, MenuItem } from '@/types/entities';
import * as cartService from '@/services/cartService';
import { useAuth } from '@/hooks/useAuth';

interface CartContextType {
  cart: Cart;
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  clearCart: () => void;
  totals: { totalItems: number; totalAmount: number };
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
  const { session } = useAuth();
  const [cart, setCart] = useState<Cart>(() => {
    // 초기 로드 시 세션별 장바구니 복원
    const saved = cartService.loadCartFromLocalStorage(session?.sessionId);
    return saved || { items: [], lastUpdated: new Date().toISOString() };
  });

  // 세션이 변경되면 해당 세션의 장바구니 로드
  useEffect(() => {
    if (session?.sessionId) {
      const saved = cartService.loadCartFromLocalStorage(session.sessionId);
      setCart(saved || { items: [], lastUpdated: new Date().toISOString() });
    } else {
      // 로그아웃 시 장바구니 초기화
      setCart({ items: [], lastUpdated: new Date().toISOString() });
    }
  }, [session?.sessionId]);

  const addToCart = (item: MenuItem, quantity: number) => {
    const updatedCart = cartService.addToCartLogic(cart, item, quantity);
    setCart(updatedCart);
    cartService.saveCartToLocalStorage(updatedCart, session?.sessionId);
  };

  const removeFromCart = (menuId: string) => {
    const updatedCart = cartService.removeFromCartLogic(cart, menuId);
    setCart(updatedCart);
    cartService.saveCartToLocalStorage(updatedCart, session?.sessionId);
  };

  const updateQuantity = (menuId: string, delta: number) => {
    const updatedCart = cartService.updateQuantityLogic(cart, menuId, delta);
    setCart(updatedCart);
    cartService.saveCartToLocalStorage(updatedCart, session?.sessionId);
  };

  const clearCart = () => {
    const emptyCart = cartService.clearCartLogic();
    setCart(emptyCart);
    cartService.clearCartFromLocalStorage(session?.sessionId);
  };

  const totals = cartService.calculateCartTotals(cart);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
