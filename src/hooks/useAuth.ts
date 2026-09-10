'use client';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  /**
   * Role as stored in the `users` table in the database. Never trust a value
   * derived on the client for access control — the server (middleware, API
   * routes and Postgres RLS) re-checks this on every privileged request.
   */
  role: UserRole;
  created_at?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  /** True when Supabase created the account but requires e-mail confirmation before a session exists. */
  needsEmailConfirmation?: boolean;
}

export interface SignUpDetails {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

/**
 * Supabase's browser client keeps the session in localStorage, which Next.js
 * middleware cannot read. We mirror the access token into a cookie so that
 * `src/middleware.ts` can verify it server-side against Supabase before letting
 * anyone near /admin. The cookie carries no more secrets than localStorage
 * already does; it is the transport that lets the *server* be the gatekeeper.
 */
const ACCESS_TOKEN_COOKIE = 'sb-access-token';

const NOT_CONFIGURED_MESSAGE =
  'Accounts are unavailable right now because authentication is not configured.';

const isSecureContext = () =>
  typeof window !== 'undefined' && window.location.protocol === 'https:';

function writeSessionCookie(session: Session | null): void {
  if (typeof document === 'undefined') return;

  const secure = isSecureContext() ? '; Secure' : '';

  if (!session || !session.access_token) {
    document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at ?? nowInSeconds + 3600;
  const maxAge = Math.max(0, expiresAt - nowInSeconds);

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${session.access_token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normaliseRole(value: unknown): UserRole {
  return value === 'admin' || value === 'super_admin' ? value : 'customer';
}

/**
 * Every component that calls `useAuth()` resolves the same profile, so the
 * lookup is shared: a cached result for the signed-in user, plus de-duplication
 * of concurrent requests. Without this, a single page load would fire one
 * `users` query per hook instance.
 */
let cachedProfile: { userId: string; user: User } | null = null;
let inFlightProfile: { userId: string; promise: Promise<User> } | null = null;

function clearProfileCache(): void {
  cachedProfile = null;
  inFlightProfile = null;
}

function loadUserFromSession(session: Session, forceRefresh = false): Promise<User> {
  const userId = session.user.id;

  if (forceRefresh) {
    clearProfileCache();
  } else {
    if (cachedProfile && cachedProfile.userId === userId) {
      return Promise.resolve(cachedProfile.user);
    }
    if (inFlightProfile && inFlightProfile.userId === userId) {
      return inFlightProfile.promise;
    }
  }

  const promise = fetchUserFromSession(session)
    .then((user) => {
      cachedProfile = { userId, user };
      return user;
    })
    .finally(() => {
      if (inFlightProfile && inFlightProfile.userId === userId) {
        inFlightProfile = null;
      }
    });

  inFlightProfile = { userId, promise };
  return promise;
}

/**
 * Builds the app-level user from the verified Supabase session, taking the
 * display name and the role from the `users` profile row when it is readable.
 */
async function fetchUserFromSession(session: Session): Promise<User> {
  const authUser = session.user;
  const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
  const email = authUser.email ?? '';
  const metadataName = readString(metadata, 'name') ?? readString(metadata, 'full_name');
  const metadataPhone = readString(metadata, 'phone');

  let name = metadataName ?? email.split('@')[0] ?? 'User';
  let role: UserRole = 'customer';

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!error && data) {
      const profile = data as Record<string, unknown>;
      name = readString(profile, 'full_name') ?? name;
      role = normaliseRole(profile.role);
    }
  }

  const phone = metadataPhone ?? (authUser.phone ? authUser.phone : undefined);

  return {
    id: authUser.id,
    email,
    name,
    ...(phone ? { phone } : {}),
    role,
    created_at: authUser.created_at
  };
}

function messageFor(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(false);

  const applySession = useCallback(
    async (session: Session | null, forceRefresh = false): Promise<void> => {
      writeSessionCookie(session);

      if (!session) {
        clearProfileCache();
        if (isMountedRef.current) setUser(null);
        return;
      }

      try {
        const nextUser = await loadUserFromSession(session, forceRefresh);
        if (isMountedRef.current) setUser(nextUser);
      } catch {
        // A failed profile lookup must not leave a half-authenticated UI.
        clearProfileCache();
        if (isMountedRef.current) setUser(null);
      }
    },
    []
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!supabase) {
      // Unconfigured deployment: nobody is signed in, and nothing should hang.
      writeSessionCookie(null);
      setUser(null);
      setIsLoading(false);
      return () => {
        isMountedRef.current = false;
      };
    }

    const client = supabase;

    const finish = () => {
      if (isMountedRef.current) setIsLoading(false);
    };

    client.auth
      .getSession()
      .then(async ({ data }) => {
        await applySession(data.session ?? null);
      })
      .catch(() => {
        if (isMountedRef.current) setUser(null);
      })
      .finally(finish);

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      // Write the cookie synchronously so a redirect right after sign-in is
      // already authenticated, then hydrate the profile outside the auth
      // callback (calling the Supabase client from inside it can deadlock).
      writeSessionCookie(session);

      if (!session) {
        clearProfileCache();
        if (isMountedRef.current) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // TOKEN_REFRESHED keeps the same profile; only the cookie needs rewriting.
      setTimeout(() => {
        void applySession(session).finally(finish);
      }, 0);
    });

    return () => {
      isMountedRef.current = false;
      subscription.subscription.unsubscribe();
    };
  }, [applySession]);

  const isAuthenticated = useCallback(() => user !== null, [user]);

  const isConfigured = useCallback(() => isSupabaseConfigured(), []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: NOT_CONFIGURED_MESSAGE };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        return { success: false, error: messageFor(error, 'Invalid email or password.') };
      }

      await applySession(data.session ?? null, true);
      if (isMountedRef.current) setIsLoading(false);

      return { success: true };
    } catch (error) {
      return { success: false, error: messageFor(error, 'Sign in failed. Please try again.') };
    }
  }, [applySession]);

  const signUp = useCallback(async (details: SignUpDetails): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: NOT_CONFIGURED_MESSAGE };
    }

    const { email, password, name, phone } = details;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name,
            full_name: name,
            ...(phone ? { phone } : {})
          }
        }
      });

      if (error) {
        return { success: false, error: messageFor(error, 'Could not create the account.') };
      }

      if (!data.session) {
        // E-mail confirmation is enabled on the project: no session yet.
        return { success: true, needsEmailConfirmation: true };
      }

      await applySession(data.session, true);
      if (isMountedRef.current) setIsLoading(false);

      return { success: true };
    } catch (error) {
      return { success: false, error: messageFor(error, 'Sign up failed. Please try again.') };
    }
  }, [applySession]);

  const signOut = useCallback(async (): Promise<void> => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Even if the network call fails, drop the local session below.
      }
    }

    clearProfileCache();
    writeSessionCookie(null);
    if (isMountedRef.current) setUser(null);

    if (typeof window !== 'undefined') {
      // The cart listens for this to clear per-user state immediately.
      window.dispatchEvent(new CustomEvent('userLogout'));
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    if (!supabase) {
      clearProfileCache();
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session ?? null, true);
    } catch {
      if (isMountedRef.current) setUser(null);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [applySession]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isConfigured,
    signIn,
    signUp,
    signOut,
    /** Alias of `signOut`, kept so existing call sites keep working. */
    logout: signOut,
    refreshAuth
  };
}
