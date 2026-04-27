// CartContext.tsx
import React, { createContext, use, useState, useCallback, useEffect, useRef } from 'react';
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

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Ref para acceder al valor actual de items sin re-crear callbacks
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── Sync con DB al cambiar el usuario ───────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    (async () => {
      const local = itemsRef.current;

      if (local.length > 0) {
        await syncCart(
          user.id,
          local.map(({ product, quantity }) => ({ product_id: product.id, quantity }))
        );
      }

      setItems(await loadCart(user.id));
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mutaciones ───────────────────────────────────────────────────────────────

  const addItem = useCallback((product: Product, quantity = 1) => {
    const existing = itemsRef.current.find(i => i.product.id === product.id);
    const newQty = Math.min((existing?.quantity ?? 0) + quantity, product.stock);

    setItems(prev =>
      existing
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i)
        : [...prev, { product, quantity: newQty }]
    );

    if (user) upsertCartItem(user.id, product.id, newQty).catch(() => {});
    setIsOpen(true);
  }, [user]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
    if (user) removeCartItem(user.id, productId).catch(() => {});
  }, [user]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
      if (user) removeCartItem(user.id, productId).catch(() => {});
      return;
    }

    const clampedQty = Math.min(
      quantity,
      itemsRef.current.find(i => i.product.id === productId)?.product.stock ?? quantity
    );

    setItems(prev =>
      prev.map(i => i.product.id === productId ? { ...i, quantity: clampedQty } : i)
    );

    if (user) updateCartQuantity(user.id, productId, clampedQty).catch(() => {});
  }, [user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) await clearCartDB(user.id);
  }, [user]);

  // ── Valores derivados ────────────────────────────────────────────────────────

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal   = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    // React 19: <Context> en lugar de <Context.Provider>
    <CartContext value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, subtotal, isOpen,
      openCart:  () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext>
  );
}

// React 19: use() en lugar de useContext()
export function useCart() {
  const ctx = use(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}