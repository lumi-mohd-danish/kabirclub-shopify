import { ReactNode, Suspense } from 'react';

import Footer from '@/components/sections/Footer';
import Header from '@/components/sections/Header';

/**
 * The storefront shell.
 *
 * This exists as a route group so that `/admin` — which sits OUTSIDE
 * `(storefront)` — stops inheriting the marketing header and footer. Before
 * this split, every admin screen rendered the shop's navigation and its five
 * footer columns above its own AdminNav: two navigations stacked on a tool.
 *
 * A route group changes nesting without changing URLs, so `/`, `/search`,
 * `/product/[handle]` and the account routes all keep the paths they had.
 *
 * AuthProvider is deliberately NOT here — it stays in the root layout, because
 * admin reads auth as well and a single Supabase subscription should cover the
 * whole tree.
 */
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <Suspense>
        {/* Intentionally NOT `.container-page`. The homepage's ink bands are
            full-bleed `.section-band`s that live inside <main>, so the inset
            belongs to each section's inner wrapper, not to <main>. */}
        <main>{children}</main>
      </Suspense>
      <Footer />
    </>
  );
}
