// next
import type { Metadata, Viewport } from 'next';

// react
import { ReactNode, Suspense } from 'react';

// components
import Header from '@/components/sections/Header';
import Footer from '@/components/sections/Footer';
import { AuthProvider } from '@/components/providers/AuthProvider';

// utils
import { ensureStartsWith } from '@/lib/utils';

// site config
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_IMAGE,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_THEME_COLOR,
  SITE_URL
} from '@/lib/constants';

// styles
import '@/styles/globals.css';

// fonts
import { display, sans } from '@/fonts/fonts';

// metadata
const { TWITTER_CREATOR, TWITTER_SITE } = process.env;
const twitterCreator = TWITTER_CREATOR ? ensureStartsWith(TWITTER_CREATOR, '@') : undefined;
const twitterSite = TWITTER_SITE ? ensureStartsWith(TWITTER_SITE, 'https://') : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_AUTHOR }],
  robots: {
    follow: true,
    index: true
  },
  // Only site-wide values belong here: child routes inherit this object verbatim
  // unless they declare their own `openGraph`, and Next.js back-fills og:title /
  // og:description from each page's own title + description when they are absent.
  // Setting them (or og:url) here would make every product page advertise the
  // homepage instead of itself.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    images: [
      {
        url: SITE_IMAGE,
        width: 680,
        height: 208,
        alt: SITE_NAME
      }
    ]
  },
  // Card title, description and image are auto-filled per page from the
  // resolved metadata above, so they are intentionally not pinned here.
  ...(twitterCreator &&
    twitterSite && {
      twitter: {
        card: 'summary_large_image',
        creator: twitterCreator,
        site: twitterSite
      }
    }),
  icons: { icon: '/favicon.png' }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: SITE_THEME_COLOR
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Only the two CSS variables. `sans.className` is deliberately absent: it
    // would pin font-family on <html> at specificity (0,1,0), which is the one
    // thing the fallback declarations in globals.css `@layer base` are written
    // to lose to — and it is redundant, because `body` already resolves
    // `font-sans` to `var(--font-sans)`. Variables in, cascade untouched.
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      {/* Paper is the document ground and ink is the type; `@layer base` in
          globals.css carries the same pair, but repeating it as utilities is
          what lets a route invert itself (see app/search/layout.tsx). This
          replaces the Phase 0 stopgap `bg-white text-neutral-900`, which was
          itself standing in for the white-on-white `text-veryDarkPurple`.

          `overflow-x-hidden` stays as-is. On <body>, with <html> at the
          default `visible`, CSS overflow propagation hands the value to the
          viewport and leaves body's own used value `visible`, so body never
          becomes a scroll container and `position: sticky` descendants (the
          PDP buy panel) keep working. Setting it on <html> as well would
          break them. */}
      <body className="overflow-x-hidden bg-paper text-ink">
        {/* One Supabase subscription for the whole tree. It wraps the header
            because UserProfile reads auth, and the footer because it is
            cheaper to keep the boundary at the top than to reason about which
            branch mounts a consumer next. */}
        <AuthProvider>
          <Header />
          <Suspense>
            {/* Intentionally NOT `.container-page`. The homepage's ink bands
                are full-bleed `.section-band`s that live inside <main>, so the
                inset belongs to each section's inner wrapper, not to <main>. */}
            <main>{children}</main>
          </Suspense>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
