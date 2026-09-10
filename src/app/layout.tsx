// next
import type { Metadata, Viewport } from 'next';

// react
import { ReactNode, Suspense } from 'react';

// components
import Header from '@/components/sections/Header';
import Footer from '@/components/sections/Footer';

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
import { lora, quicksand } from '@/fonts/fonts';

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
    <html lang="en" className={`${quicksand.variable} ${lora.variable} ${quicksand.className}`}>
      <body className="bg-white text-neutral-900 overflow-x-hidden">
        <Header />
        <Suspense>
          <main>{children}</main>
        </Suspense>
        <Footer />
      </body>
    </html>
  );
}
