export const SITE_NAME = 'KabirClub';

const DEFAULT_SITE_URL = 'http://localhost:3000';

/**
 * On a deploy where NEXT_PUBLIC_SITE_URL was forgotten, falling back to
 * localhost would make every absolute OG/Twitter image URL point at the
 * visitor's own machine. Prefer the platform-provided host before that.
 */
const platformSiteUrl = (): string | undefined =>
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_VERCEL_URL?.trim() ||
  process.env.VERCEL_URL?.trim() ||
  undefined;

/**
 * Resolves the public site origin into an absolute, trailing-slash-free URL.
 * Anything unparseable (or an unset env var) falls back to localhost so that
 * `new URL(SITE_URL)` in metadata can never throw at build or request time.
 */
const resolveSiteUrl = (value: string | undefined): string => {
  const trimmed = value?.trim();

  if (!trimmed) return DEFAULT_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString().replace(/\/+$/, '');
  } catch {
    return DEFAULT_SITE_URL;
  }
};

export const SITE_URL = resolveSiteUrl(platformSiteUrl());

export const SITE_DESCRIPTION =
  'KabirClub — premium Indian menswear. Shop shirts, t-shirts, trousers and accessories with prices in INR, free shipping over ₹2000.';

export const SITE_KEYWORDS = [
  'menswear',
  'indian menswear',
  'mens clothing',
  'shirts',
  't-shirts',
  'trousers',
  'accessories',
  'KabirClub'
];

export const SITE_AUTHOR = 'KabirClub Team';

export const SITE_IMAGE = '/images/logo.png';

// The colour the mobile browser paints its own chrome with. It should match
// the band the header sits in, which under Ink & Zari is ink-900 — not the
// gold accent, which would frame a near-black header in brass.
export const SITE_THEME_COLOR = '#171310';
