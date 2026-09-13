'use client';

import { useCallback } from 'react';
import { useAuth } from './useAuth';

const ADMIN_ROLES = ['admin', 'super_admin'] as const;

/**
 * Admin status is derived from the `role` column on the user's row in the
 * database — never from a hard-coded list of e-mail addresses, and never from
 * anything the browser can set for itself.
 *
 * This hook only decides what the admin UI *shows*. Access control lives in
 * three server-side places that a client cannot bypass:
 *   1. `src/middleware.ts` — verifies the session and role before /admin renders.
 *   2. API routes (e.g. `src/app/api/upload/route.ts`) — re-verify per request.
 *   3. Postgres row-level security — see `enable-rls-policies.sql`.
 */
export function useAdminAuth() {
  const auth = useAuth();
  const { user, isAuthenticated } = auth;

  const isAdmin = useCallback(() => {
    if (!user) return false;
    return (ADMIN_ROLES as readonly string[]).includes(user.role);
  }, [user]);

  const requireAdmin = useCallback(() => {
    if (!isAuthenticated()) {
      throw new Error('You need to sign in to do that.');
    }
    if (!isAdmin()) {
      throw new Error('Admin access required.');
    }
    return true;
  }, [isAuthenticated, isAdmin]);

  return {
    ...auth,
    isAdmin,
    requireAdmin
  };
}
