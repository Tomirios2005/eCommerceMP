import { supabase } from '../lib/supabase';
import type { CartItem, Product } from '../lib/types';
import { isExpress } from './config';
import { apiRequest } from './api';

/**
 * Bulk-upsert local items to the DB after login.
 * In Express mode, userId is ignored (JWT provides it server-side).
 */
export async function syncCart(
  userId: string,
  localItems: { product_id: string; quantity: number }[]
): Promise<void> {
  if (isExpress()) {
    await apiRequest('/api/cart/sync', {
      method: 'POST',
      body: JSON.stringify({ items: localItems }),
    });
    return;
  }
  await supabase.from('cart_items').upsert(
    localItems.map(item => ({
      user_id:    userId,
      product_id: item.product_id,
      quantity:   item.quantity,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,product_id' }
  );
}

/**
 * Load the authoritative cart from the DB.
 * In Express mode, userId is ignored (JWT provides it server-side).
 */
export async function loadCart(userId: string): Promise<CartItem[]> {
  if (isExpress()) {
    const data = await apiRequest<{ quantity: number; product: Product }[]>('/api/cart');
    return data.filter(row => row.product).map(row => ({
      product:  row.product,
      quantity: row.quantity,
    }));
  }
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity, product:products(*)')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data
    .filter(row => row.product)
    .map(row => ({ product: row.product as unknown as Product, quantity: row.quantity }));
}

/**
 * Upsert a single cart item (sets absolute quantity).
 * Fire-and-forget friendly — callers can omit await.
 */
export async function upsertCartItem(
  userId: string,
  productId: string,
  quantity: number
): Promise<void> {
  if (isExpress()) {
    await apiRequest('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    return;
  }
  await supabase.from('cart_items').upsert(
    { user_id: userId, product_id: productId, quantity, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,product_id' }
  );
}

/**
 * Remove a single item from the cart.
 */
export async function removeCartItem(userId: string, productId: string): Promise<void> {
  if (isExpress()) {
    await apiRequest(`/api/cart/${productId}`, { method: 'DELETE' });
    return;
  }
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
}

/**
 * Update the quantity of a single cart item.
 */
export async function updateCartQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<void> {
  if (isExpress()) {
    await apiRequest(`/api/cart/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    return;
  }
  await supabase
    .from('cart_items')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('product_id', productId);
}

/**
 * Clear the entire cart for a user.
 */
export async function clearCartDB(userId: string): Promise<void> {
  if (isExpress()) {
    await apiRequest('/api/cart', { method: 'DELETE' });
    return;
  }
  await supabase.from('cart_items').delete().eq('user_id', userId);
}
