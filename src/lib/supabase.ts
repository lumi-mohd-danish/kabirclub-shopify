import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have valid environment variables
const hasValidConfig = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

// Create Supabase client only if we have valid config
export const supabase = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => hasValidConfig;

/**
 * The client type every data-layer function accepts.
 *
 * Identical to what `createClient(url, key)` returns, so the module-level
 * `supabase` singleton and a per-request session client are interchangeable.
 */
export type SupabaseDbClient = SupabaseClient;

/** Request header PostgREST exposes to Postgres as `request.headers->>'x-session-id'`. */
export const SESSION_ID_HEADER = 'x-session-id';

/**
 * Build a per-request Supabase client that announces the caller's guest cart
 * session to Postgres.
 *
 * WHY THIS EXISTS. Guest carts and guest orders are keyed by a `sessionId`
 * cookie, and that cookie is httpOnly so page JavaScript can neither read it
 * nor forge one. Postgres cannot see a cookie either, so the row-level security
 * policies in `enable-rls-policies.sql` (sections 6 and 7) read the session from
 * the `x-session-id` request header instead, via `public.request_session_id()`.
 * Something has to put it there, and the module-level `supabase` singleton
 * above cannot: it is constructed once at import time, with no request context,
 * and is shared by every concurrent visitor. A client carrying one visitor's
 * session id must therefore be created per request — which is what this does.
 *
 * Call it from server code only (a server action or a route handler) with the
 * value of the httpOnly cookie. Auth persistence is switched off because the
 * client is single-use and must not pick up or write back any stored session.
 *
 * Returns `null` when Supabase is unconfigured or no session id is available,
 * which is the same "no client" contract the singleton uses — callers fall back
 * to sample data instead of throwing.
 */
export function createSessionClient(sessionId: string | null | undefined): SupabaseDbClient | null {
  if (!hasValidConfig) return null;

  const trimmed = typeof sessionId === 'string' ? sessionId.trim() : '';
  if (!trimmed) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: { [SESSION_ID_HEADER]: trimmed }
    }
  });
}

// Re-export types from the types file
export type { Product, Collection, CartItem, User } from './supabase/types';
