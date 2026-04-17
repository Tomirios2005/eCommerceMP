/**
 * Backend toggle configuration.
 *
 * Set VITE_BACKEND_MODE=express in .env to route all data calls through
 * the Express API. Any other value (or absent) uses Supabase directly.
 *
 * Set VITE_EXPRESS_URL to the Express server base URL (default: http://localhost:3001).
 */
export const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE || 'supabase';
export const EXPRESS_URL  = import.meta.env.VITE_EXPRESS_URL  || 'http://localhost:3001';

/** Returns true when Express backend is active. */
export const isExpress = () => BACKEND_MODE === 'express';
