import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { CartItem, Product } from '../lib/types';
import { useAuth } from './AuthContext';
import {
  syncCart,
  loadCart,
  upsertCartItem,
  removeCartItem,
  updateCartQuantity,
  clearCartDB,
} from '../services/cartService';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: async () => {},
  totalItems: 0,
  subtotal: 0,
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── Sync cart with DB when auth state changes ────────────────────────────────
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const syncAndLoad = async () => {
      const local = itemsRef.current;

      // Persist any locally-held items first (e.g. browsed before logging in).
      if (local.length > 0) {
        await syncCart(
          user.id,
          local.map(item => ({ product_id: item.product.id, quantity: item.quantity }))
        );
      }

      // Load the authoritative cart from DB.
      const cartItems = await loadCart(user.id);
      setItems(cartItems);
    };

    syncAndLoad();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cart mutations ───────────────────────────────────────────────────────────

  const addItem = useCallback((product: Product, quantity = 1) => {
    const existing = itemsRef.current.find(i => i.product.id === product.id);
    const newQty = existing
      ? Math.min(existing.quantity + quantity, product.stock)
      : Math.min(quantity, product.stock);

    setItems(prev =>
      existing
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i)
        : [...prev, { product, quantity: newQty }]
    );

    if (user) {
      upsertCartItem(user.id, product.id, newQty).catch(() => {});
    }

    setIsOpen(true);
  }, [user]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));

    if (user) {
      removeCartItem(user.id, productId).catch(() => {});
    }
  }, [user]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
      if (user) {
        removeCartItem(user.id, productId).catch(() => {});
      }
      return;
    }

    const item = itemsRef.current.find(i => i.product.id === productId);
    const clampedQty = item ? Math.min(quantity, item.product.stock) : quantity;

    setItems(prev =>
      prev.map(i => i.product.id === productId ? { ...i, quantity: clampedQty } : i)
    );

    if (user) {
      updateCartQuantity(user.id, productId, clampedQty).catch(() => {});
    }
  }, [user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      await clearCartDB(user.id);
    }
  }, [user]);

  const openCart  = useCallback(() => setIsOpen(true),  []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, isOpen, openCart, closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
