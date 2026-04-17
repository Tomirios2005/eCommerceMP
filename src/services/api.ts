import { supabase } from '../lib/supabase';
import { EXPRESS_URL } from './config';

/**
 * Authenticated fetch helper for the Express backend.
 * Automatically attaches the current Supabase session token as Bearer.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`${EXPRESS_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error de red' }));
    throw new Error(err.message || err.error || 'Error del servidor');
  }

  return res.json() as Promise<T>;
}
