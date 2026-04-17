import { supabase } from '../lib/supabase';
import type { Product } from '../lib/types';
import { isExpress } from './config';
import { apiRequest } from './api';

export async function getProducts(filters?: {
  category?: string | null;
  search?: string;
}): Promise<Product[]> {
  if (isExpress()) {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search)   params.set('search', filters.search);
    const qs = params.toString() ? `?${params}` : '';
    return apiRequest<Product[]>(`/api/products${qs}`);
  }

  let query = supabase
    .from('products')
    .select('*, category:categories(id,name), images:product_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('category_id', filters.category);
  if (filters?.search)   query = query.ilike('name', `%${filters.search}%`);

  const { data } = await query;
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isExpress()) {
    try {
      return await apiRequest<Product>(`/api/products/${slug}`);
    } catch {
      return null;
    }
  }

  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return data as Product | null;
}

export async function getAdminProducts(search?: string): Promise<Product[]> {
  if (isExpress()) {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiRequest<Product[]>(`/api/products/admin${qs}`);
  }

  let query = supabase
    .from('products')
    .select('*, category:categories(id,name)')
    .order('created_at', { ascending: false });
  if (search) query = query.ilike('name', `%${search}%`);

  const { data } = await query;
  return (data ?? []) as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isExpress()) {
    try {
      return await apiRequest<Product>(`/api/products/id/${id}`);
    } catch {
      return null;
    }
  }

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  return data as Product | null;
}

export async function createProduct(data: Partial<Product>): Promise<void> {
  if (isExpress()) {
    await apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return;
  }
  const { error } = await supabase.from('products').insert([data]);
  if (error) throw new Error(error.message);
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  if (isExpress()) {
    await apiRequest(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return;
  }
  const { error } = await supabase.from('products').update(data).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  if (isExpress()) {
    await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
    return;
  }
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleProductActive(id: string, currentIsActive: boolean): Promise<void> {
  if (isExpress()) {
    await apiRequest(`/api/products/${id}/toggle`, { method: 'PATCH' });
    return;
  }
  const { error } = await supabase
    .from('products')
    .update({ is_active: !currentIsActive })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
