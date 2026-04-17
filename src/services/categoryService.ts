import { supabase } from '../lib/supabase';
import type { Category } from '../lib/types';
import { isExpress } from './config';
import { apiRequest } from './api';

export async function getCategories(): Promise<Category[]> {
  if (isExpress()) {
    return apiRequest<Category[]>('/api/categories');
  }
  const { data } = await supabase.from('categories').select('*');
  return (data ?? []) as Category[];
}

export async function createCategory(name: string): Promise<Category> {
  if (isExpress()) {
    return apiRequest<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}
