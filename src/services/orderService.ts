import { supabase } from '../lib/supabase';
import type { Order, OrderStatus } from '../lib/types';
import { isExpress } from './config';
import { apiRequest } from './api';

export interface CheckoutItem {
  product_id:    string;
  product_name:  string;
  product_image: string;
  quantity:      number;
  unit_price:    number;
  total_price:   number;
}

export interface CheckoutParams {
  userId:       string;
  total:        number;
  subtotal:     number;
  shippingCost: number;
  address:      Record<string, string>;
  items:        CheckoutItem[];
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function getOrders(userId: string): Promise<Order[]> {
  if (isExpress()) {
    return apiRequest<Order[]>('/api/orders');
  }
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Order[];
}

/**
 * Atomically creates an order, decrements stock, and clears the cart.
 * Returns the new order ID.
 */
export async function createOrder(params: CheckoutParams): Promise<string> {
  if (isExpress()) {
    return apiRequest<string>('/api/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({
        total:         params.total,
        subtotal:      params.subtotal,
        shipping_cost: params.shippingCost,
        address:       params.address,
        items:         params.items,
      }),
    });
  }

  const { data: orderId, error } = await supabase.rpc('create_order_with_stock', {
    p_user_id:       params.userId,
    p_total:         params.total,
    p_subtotal:      params.subtotal,
    p_shipping_cost: params.shippingCost,
    p_address:       params.address,
    p_items:         params.items,
  });
  if (error) throw new Error(error.message);
  if (!orderId) throw new Error('Error al crear el pedido. Intentá de nuevo.');
  return orderId as string;
}

export async function cancelOrder(orderId: string): Promise<void> {
  if (isExpress()) {
    await apiRequest(`/api/orders/${orderId}/cancel`, { method: 'PATCH' });
    return;
  }
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);
  if (error) throw new Error(error.message);
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAdminOrders(): Promise<Order[]> {
  if (isExpress()) {
    return apiRequest<Order[]>('/api/orders/admin');
  }
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false });
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (isExpress()) {
    await apiRequest(`/api/orders/admin/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return;
  }
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (error) throw new Error(error.message);
}

// ── Payments ──────────────────────────────────────────────────────────────────

/**
 * Creates a Mercado Pago payment preference via the Supabase Edge Function.
 * This always calls Supabase regardless of BACKEND_MODE — the session token
 * is required and the MP credentials live in Supabase Secrets.
 */
export async function createPaymentPreference(
  orderId: string,
  items: Array<{ product: { id: string; name: string; price: number; main_image: string }; quantity: number }>,
  total: number,
  sessionToken: string
): Promise<{ init_point: string; sandbox_init_point?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(
    `${supabaseUrl}/functions/v1/create-mercadopago-preference`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey:        supabaseKey,
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ orderId, items, total }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Error de red' }));
    throw new Error(errData.error || 'Error al procesar el pago');
  }

  return res.json();
}
