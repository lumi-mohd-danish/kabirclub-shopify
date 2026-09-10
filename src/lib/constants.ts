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

export const SITE_FAVICON = '/favicon.png';

export const SITE_MANIFEST = '/manifest.json';

// The colour the mobile browser paints its own chrome with. It should match
// the band the header sits in, which under Ink & Zari is ink-900 — not the
// gold accent, which would frame a near-black header in brass.
export const SITE_THEME_COLOR = '#171310';

export const SITE_BACKGROUND_COLOR = '#ffffff';

export const SITE_DISPLAY = 'standalone';

export const SITE_ORIENTATION = 'portrait';

export const SITE_SCOPE = '/';

export const SITE_START_URL = '/';

export const SITE_CATEGORY = 'shopping';

export const SITE_LANG = 'en';

export const SITE_DIR = 'ltr';

export const SITE_ICONS = [
  {
    src: '/favicon.png',
    sizes: '32x32',
    type: 'image/png'
  },
  {
    src: '/images/logo.png',
    sizes: '192x192',
    type: 'image/png'
  }
];

export const SITE_SHORTCUTS = [
  {
    name: 'Home',
    short_name: 'Home',
    description: 'Go to homepage',
    url: '/',
    icons: [
      {
        src: '/favicon.png',
        sizes: '32x32'
      }
    ]
  }
];

export const SITE_SCREENS = [
  {
    src: '/screenshots/screenshot-desktop.png',
    sizes: '1280x720',
    type: 'image/png',
    form_factor: 'wide'
  },
  {
    src: '/screenshots/screenshot-mobile.png',
    sizes: '750x1334',
    type: 'image/png',
    form_factor: 'narrow'
  }
];

export const SITE_CATEGORIES = [
  'Topwear',
  'Bottomwear',
  'Accessories'
];

export const SITE_SORT_OPTIONS = [
  { label: 'Latest', value: 'created_at-desc' },
  { label: 'Oldest', value: 'created_at-asc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' }
];

export const SITE_PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

export const SITE_CART = {
  MAX_ITEMS: 100,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
};

export const SITE_CURRENCY = {
  CODE: 'INR',
  SYMBOL: '₹',
  LOCALE: 'en-IN'
};

export const SITE_TAX = {
  RATE: 0.18, // 18% GST
  INCLUSIVE: false
};

export const SITE_SHIPPING = {
  FREE_THRESHOLD: 2000, // Free shipping above ₹2000
  STANDARD_COST: 200,
  EXPRESS_COST: 400
};

// Filter and sort types
export interface SortFilterItem {
  title: string;
  slug: string | null;
  sortKey: string;
  reverse: boolean;
}

export const SORT_FILTER_ITEMS: SortFilterItem[] = [
  { title: 'Latest', slug: 'latest', sortKey: 'created_at', reverse: true },
  { title: 'Oldest', slug: 'oldest', sortKey: 'created_at', reverse: false },
  { title: 'Price: Low to High', slug: 'price-low-high', sortKey: 'price', reverse: false },
  { title: 'Price: High to Low', slug: 'price-high-low', sortKey: 'price', reverse: true }
];
