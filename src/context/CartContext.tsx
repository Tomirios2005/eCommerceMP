import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { CartItem, Product } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

  // Keep a ref to the latest items so callbacks can read current state without
  // needing `items` in their dependency arrays (avoids re-creating on every change).
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

      // If the user had local items (e.g. browsed before logging in), persist them first.
      if (local.length > 0) {
        await supabase.from('cart_items').upsert(
          local.map(item => ({
            user_id:    user.id,
            product_id: item.product.id,
            quantity:   item.quantity,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'user_id,product_id' }
        );
      }

      // Load the authoritative cart from DB.
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity, product:products(*)')
        .eq('user_id', user.id);

      if (error || !data) return;

      setItems(
        data
          .filter(row => row.product)
          .map(row => ({ product: row.product as unknown as Product, quantity: row.quantity }))
      );
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
      supabase.from('cart_items').upsert(
        { user_id: user.id, product_id: product.id, quantity: newQty, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,product_id' }
      ).then();
    }

    setIsOpen(true);
  }, [user]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));

    if (user) {
      supabase.from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .then();
    }
  }, [user]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Reuse removeItem logic inline to avoid circular dep
      setItems(prev => prev.filter(i => i.product.id !== productId));
      if (user) {
        supabase.from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .then();
      }
      return;
    }

    const item = itemsRef.current.find(i => i.product.id === productId);
    const clampedQty = item ? Math.min(quantity, item.product.stock) : quantity;

    setItems(prev =>
      prev.map(i => i.product.id === productId ? { ...i, quantity: clampedQty } : i)
    );

    if (user) {
      supabase.from('cart_items')
        .update({ quantity: clampedQty, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .then();
    }
  }, [user]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
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
