import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side gate for /admin.
 *
 * The client-side checks in `useAdminAuth` decide what the admin UI shows; they
 * are not access control, because anyone can edit their own JavaScript. This
 * middleware runs before any /admin route renders and:
 *
 *   1. reads the Supabase access token from the `sb-access-token` cookie
 *      (written by `useAuth` from the Supabase session),
 *   2. asks Supabase to verify it — an unsigned or expired token fails here,
 *   3. reads the caller's `role` from the `users` table using that same token,
 *      so row-level security applies, and
 *   4. allows the request only for role 'admin' or 'super_admin'.
 *
 * It fails closed: any missing configuration, network error or unexpected
 * response denies the request. The matcher covers /admin only, so storefront
 * routes are never touched — including when Supabase is unconfigured.
 */

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';
const VERIFY_TIMEOUT_MS = 5000;

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_KEY) {
    return null;
  }

  return { url: url.replace(/\/+$/, ''), anonKey };
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
}

function redirectTo(request: NextRequest, pathname: string, params: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return noStore(NextResponse.redirect(url));
}

/** Sends an unauthenticated visitor to the sign-in page, remembering where they were headed. */
function requireSignIn(request: NextRequest, reason: 'signin' | 'unavailable') {
  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const response = redirectTo(request, '/login', { redirect: target, reason });

  if (reason === 'signin') {
    // Drop a token that did not verify so the browser stops resending it.
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 });
  }

  return response;
}

/** Sends a signed-in but non-admin visitor back to the storefront. */
function forbid(request: NextRequest) {
  return redirectTo(request, '/', { error: 'admin-only' });
}

async function supabaseFetch(url: string, config: SupabaseConfig, token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store',
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Returns the verified user id, or null when the token is not valid. */
async function verifyToken(config: SupabaseConfig, token: string): Promise<string | null> {
  const response = await supabaseFetch(`${config.url}/auth/v1/user`, config, token);
  if (!response.ok) return null;

  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') return null;

  const id = (body as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/** Reads the role for a verified user id from the `users` table. */
async function fetchRole(
  config: SupabaseConfig,
  token: string,
  userId: string
): Promise<string | null> {
  const query = `${config.url}/rest/v1/users?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`;
  const response = await supabaseFetch(query, config, token);
  if (!response.ok) return null;

  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const first = rows[0];
  if (!first || typeof first !== 'object') return null;

  const role = (first as { role?: unknown }).role;
  return typeof role === 'string' ? role : null;
}

export async function middleware(request: NextRequest) {
  const supabaseConfig = getSupabaseConfig();

  // Fail closed: with no auth backend there is no way to prove admin rights.
  if (!supabaseConfig) {
    return requireSignIn(request, 'unavailable');
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return requireSignIn(request, 'signin');
  }

  try {
    const userId = await verifyToken(supabaseConfig, token);
    if (!userId) {
      return requireSignIn(request, 'signin');
    }

    const role = await fetchRole(supabaseConfig, token, userId);
    if (!role || !ADMIN_ROLES.has(role)) {
      return forbid(request);
    }
  } catch {
    // Timeouts and network failures deny access rather than granting it.
    return requireSignIn(request, 'unavailable');
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: ['/admin', '/admin/:path*']
};
