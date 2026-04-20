import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Product, CartItem, SelectedOption } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, selectedOptions?: SelectedOption[]) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const storageKey = restaurantSlug ? `cart_${restaurantSlug}` : 'cart';

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  // Se o slug mudar, recarrega o carrinho correspondente
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setItems(saved ? JSON.parse(saved) : []);
  }, [storageKey]);

  const addItem = (product: Product, selectedOptions: SelectedOption[] = []) => {
    const cartId = `${product.id}-${selectedOptions.map(o => o.optionId).sort().join('-')}`;

    setItems((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedOptions, cartId }];
    });
  };

  const removeItem = (cartId: string) => {
    setItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const optionsPrice = item.selectedOptions?.reduce((s, o) => s + o.price, 0) || 0;
    return sum + (item.price + optionsPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
