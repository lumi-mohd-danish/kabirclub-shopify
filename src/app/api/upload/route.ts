import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-side image upload.
 *
 * The ImgBB key lives in `IMGBB_API_KEY` and is read here, on the server, so it
 * never reaches the browser bundle. Only a verified admin may call this route:
 * the caller's Supabase access token is checked against Supabase and their
 * `role` is read from the `users` table before anything is forwarded.
 *
 * Request: multipart/form-data with either
 *   - `file`  — the image file, or
 *   - `image` — a raw base64 string (no `data:` prefix).
 * Response: { url, deleteUrl?, filename, size }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

/** ImgBB's own ceiling is 32MB. */
const MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]);

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_KEY) {
    return null;
  }

  return { url: url.replace(/\/+$/, ''), anonKey };
}

function getAccessToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header && header.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7).trim();
    if (token) return token;
  }

  return request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

async function supabaseFetch(url: string, config: SupabaseConfig, token: string) {
  return fetch(url, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  });
}

/** Verifies the bearer token and confirms the user's stored role is an admin one. */
async function authoriseAdmin(request: NextRequest): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const config = getSupabaseConfig();
  if (!config) {
    return {
      ok: false,
      response: jsonError('Uploads are unavailable because authentication is not configured.', 503)
    };
  }

  const token = getAccessToken(request);
  if (!token) {
    return { ok: false, response: jsonError('You must be signed in to upload images.', 401) };
  }

  try {
    const userResponse = await supabaseFetch(`${config.url}/auth/v1/user`, config, token);
    if (!userResponse.ok) {
      return { ok: false, response: jsonError('Your session has expired. Please sign in again.', 401) };
    }

    const authUser: unknown = await userResponse.json();
    const userId =
      authUser && typeof authUser === 'object' ? (authUser as { id?: unknown }).id : undefined;

    if (typeof userId !== 'string' || userId.length === 0) {
      return { ok: false, response: jsonError('Your session has expired. Please sign in again.', 401) };
    }

    const roleResponse = await supabaseFetch(
      `${config.url}/rest/v1/users?select=role&id=eq.${encodeURIComponent(userId)}&limit=1`,
      config,
      token
    );

    if (!roleResponse.ok) {
      return { ok: false, response: jsonError('Could not verify your permissions.', 403) };
    }

    const rows: unknown = await roleResponse.json();
    const first = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    const role =
      first && typeof first === 'object' ? (first as { role?: unknown }).role : undefined;

    if (typeof role !== 'string' || !ADMIN_ROLES.has(role)) {
      return { ok: false, response: jsonError('Admin access required.', 403) };
    }

    return { ok: true };
  } catch {
    return { ok: false, response: jsonError('Could not verify your permissions.', 503) };
  }
}

function isBase64(value: string): boolean {
  return value.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

interface UploadPayload {
  base64: string;
  filename: string;
  size: number;
}

async function readPayload(
  request: NextRequest
): Promise<{ ok: true; payload: UploadPayload } | { ok: false; response: NextResponse }> {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return { ok: false, response: jsonError('Expected a multipart/form-data upload.', 400) };
  }

  const file = form.get('file');

  if (file && typeof file !== 'string') {
    if (file.size === 0) {
      return { ok: false, response: jsonError('The selected file is empty.', 400) };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, response: jsonError('Image size must be less than 32MB.', 413) };
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { ok: false, response: jsonError('Supported formats: JPEG, PNG, GIF, WebP.', 415) };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    return {
      ok: true,
      payload: {
        base64: buffer.toString('base64'),
        filename: file.name || 'upload',
        size: buffer.byteLength
      }
    };
  }

  const rawImage = form.get('image');

  if (typeof rawImage === 'string' && rawImage.length > 0) {
    // Accept both a bare base64 string and a full data: URI.
    const commaIndex = rawImage.indexOf(',');
    const base64 = rawImage.startsWith('data:') && commaIndex !== -1
      ? rawImage.slice(commaIndex + 1)
      : rawImage;

    // Check the size before validating the characters: rejecting an oversized
    // payload should not cost a scan of the whole string.
    const size = Math.floor((base64.length * 3) / 4);
    if (size > MAX_UPLOAD_BYTES) {
      return { ok: false, response: jsonError('Image size must be less than 32MB.', 413) };
    }

    if (!isBase64(base64)) {
      return { ok: false, response: jsonError('The image data is not valid base64.', 400) };
    }

    const name = form.get('filename');

    return {
      ok: true,
      payload: {
        base64,
        filename: typeof name === 'string' && name ? name : 'upload',
        size
      }
    };
  }

  return { ok: false, response: jsonError('No image was provided.', 400) };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return jsonError('Image uploads are not configured on this server.', 503);
  }

  const authorised = await authoriseAdmin(request);
  if (!authorised.ok) {
    return authorised.response;
  }

  const parsed = await readPayload(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const { base64, filename, size } = parsed.payload;

  const body = new FormData();
  body.append('image', base64);
  body.append('name', filename.replace(/\.[^.]+$/, ''));

  let imgbbResponse: Response;

  try {
    imgbbResponse = await fetch(`${IMGBB_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      body,
      cache: 'no-store',
      signal: request.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return jsonError('Upload cancelled.', 499);
    }
    return jsonError('Could not reach the image host. Please try again.', 502);
  }

  if (!imgbbResponse.ok) {
    return jsonError('The image host rejected the upload. Please try again.', 502);
  }

  const result: unknown = await imgbbResponse.json().catch(() => null);
  const data =
    result && typeof result === 'object' && (result as { success?: unknown }).success
      ? (result as { data?: Record<string, unknown> }).data
      : undefined;

  const url = data && typeof data.url === 'string' ? data.url : null;

  if (!url) {
    return jsonError('The image host did not return an image URL.', 502);
  }

  const deleteUrl = data && typeof data.delete_url === 'string' ? data.delete_url : undefined;
  const hostedSize = data && typeof data.size === 'number' ? data.size : size;
  const hostedName = data && typeof data.title === 'string' && data.title ? data.title : filename;

  return NextResponse.json(
    {
      url,
      ...(deleteUrl ? { deleteUrl } : {}),
      filename: hostedName,
      size: hostedSize
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
