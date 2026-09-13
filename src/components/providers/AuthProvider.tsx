'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useAuth } from '@/hooks/useAuth';

/**
 * One auth subscription for the whole tree.
 *
 * `useAuth()` is a *complete* auth client: it calls `supabase.auth.getSession()`,
 * registers its own `onAuthStateChange` listener, mirrors the access token into
 * the `sb-access-token` cookie that `src/middleware.ts` reads, and owns its own
 * `user` / `isLoading` state. That is correct for one instance and wasteful for
 * nine — which is what the storefront currently mounts (Header, UserProfile,
 * useAdminAuth, cart, cart modal, ProductDescription, login, signup, profile,
 * orders). Every one of them re-reads the persisted Supabase session, and each
 * settles `isLoading` on its own clock, so the header could show "Sign in" while
 * the cart already knew who you were. The `userLogin` CustomEvent bridge in
 * UserProfile.tsx exists purely to paper over that split-brain: it is one copy
 * of the state shouting at another copy across `window`.
 *
 * This provider calls `useAuth()` exactly once, at the root, and hands the same
 * value down through context. Nothing about the hook changes — Phase 0 rebuilt
 * it on real Supabase Auth (including the unconfigured fallback, where it
 * settles to `user: null, isLoading: false` without ever touching the network)
 * and it keeps working verbatim, both here and at any call site that has not
 * migrated yet. Consumers migrate by swapping `useAuth()` for `useAuthContext()`;
 * the returned shape is identical by construction (see `AuthContextValue`).
 *
 * The `userLogout` event that `signOut()` dispatches is untouched: the cart uses
 * it to drop per-user state, and that is a side effect, not shared state.
 */
export type AuthContextValue = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isLoading,
    isAuthenticated,
    isConfigured,
    signIn,
    signUp,
    signOut,
    logout,
    refreshAuth
  } = useAuth();

  // `useAuth` returns a fresh object literal on every render, so passing it
  // straight through would re-render every consumer whenever *any* piece of
  // this component re-rendered. The individual members are already stable
  // (`useCallback` for the actions, `useState` for the data), so rebuilding
  // the value only when one of them actually changes is exact, not a guess.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isConfigured,
      signIn,
      signUp,
      signOut,
      logout,
      refreshAuth
    }),
    [user, isLoading, isAuthenticated, isConfigured, signIn, signUp, signOut, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads the shared auth state. Drop-in replacement for `useAuth()` for any
 * client component rendered under the root layout.
 *
 * It throws rather than silently falling back to a private `useAuth()`
 * instance: a silent fallback would reintroduce exactly the duplicate
 * subscription this provider exists to remove, and would do it invisibly.
 */
export function useAuthContext(): AuthContextValue {
  const value = useContext(AuthContext);

  if (value === null) {
    throw new Error(
      'useAuthContext must be used inside <AuthProvider> (mounted in app/layout.tsx).'
    );
  }

  return value;
}
