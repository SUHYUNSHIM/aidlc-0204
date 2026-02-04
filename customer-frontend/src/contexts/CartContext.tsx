import { createContext, ReactNode, useState } from 'react';
import type { Cart, MenuItem } from '@/types/entities';
import * as cartService from '@/services/cartService';

interface CartContextType {
  cart: Cart;
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, delta: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
  const [cart, setCart] = useState<Cart>(() => {
    // 초기 로드 시 localStorage에서 복원
    const saved = cartService.loadCartFromLocalStorage();
    return saved || { items: [], lastUpdated: new Date().toISOString() };
  });

  const addToCart = (item: MenuItem, quantity: number) => {
    const updatedCart = cartService.addToCartLogic(cart, item, quantity);
    setCart(updatedCart);
    cartService.saveCartToLocalStorage(updatedCart);
  };

  const removeFromCart = (menuId: string) => {
    const updatedCart = cartService.removeFromCartLogic(cart, menuId);
    setCart(updatedCart);
    cartService.saveCartToLocalStorage(updatedCart);
  };

  const updateQuantity = (menuId: string, delta: number) => {
    const updatedCart = cartService.updateQuantityLogic(cart, menuId, delta);
    setCart(updatedCart);
    cartService.saveCartToLocalStorage(updatedCart);
  };

  const clearCart = () => {
    const emptyCart = cartService.clearCartLogic();
    setCart(emptyCart);
    cartService.saveCartToLocalStorage(emptyCart);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
