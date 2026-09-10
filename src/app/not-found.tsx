import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'That page could not be found. Browse the KabirClub catalogue instead.',
  robots: { index: false, follow: true }
};

/**
 * Routes offered as a way back. Every one is a real, static entry in
 * `src/app` — deliberately no collection handles, because those come from the
 * database and a 404 that links to another 404 is worse than no link at all.
 */
const WAYS_BACK = [
  { title: 'New arrivals', href: '/search?sort=created_at-desc' },
  { title: 'About us', href: '/about-us' },
  { title: 'Contact', href: '/contact' }
];

/**
 * The 404. Reachable at all only since Phase 0 deleted the catch-all route,
 * and until now it rendered one unstyled line inside a `w-screen h-screen`
 * div that forced a horizontal scrollbar.
 *
 * Paper ground, because a dead end should look like the rest of the shop
 * rather than like a system page. Gold appears three times and never as an
 * area: the woven rule, the hover hairline on the chips, and the single
 * filled CTA (`.btn-primary` = bg-zari-500 + text-ink, 8.16:1).
 */
export default function NotFound() {
  return (
    <section className="container-page section flex flex-col items-center gap-10 text-center">
      <div className="flex flex-col items-center gap-5">
        <p className="eyebrow text-ink-muted">Error 404</p>

        {/* Decorative, and announced by the eyebrow above it, so it is hidden
            from the accessibility tree. ink-faint is 3.67:1, which the palette
            allows at 16px and up — this is 40-76px. */}
        <p aria-hidden="true" className="num font-display text-display-1 text-ink-faint">
          404
        </p>

        <div className="rule-zari w-16" aria-hidden="true" />

        <h1 className="font-display text-h1 text-ink">That thread leads nowhere</h1>

        <p className="max-w-[62ch] text-lead text-ink-muted">
          The page you asked for has moved or never existed. Nothing has happened to your cart — the
          catalogue is exactly where you left it.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/search" className="btn-primary">
          Browse the catalogue
        </Link>
        <Link href="/" className="btn-secondary">
          Back to home
        </Link>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="eyebrow text-ink-muted">Or start here</p>
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {WAYS_BACK.map((route) => (
            <li key={route.href}>
              {/* Same chip recipe as the search page's empty state, so the two
                  dead ends read as one system. The hover TYPE stays `ink`:
                  these are 14px and zari-700 is only AA at 16px and up. */}
              <Link
                href={route.href}
                className="inline-flex items-center rounded-control border border-line px-4 py-2 text-body-sm text-ink-muted transition-colors duration-fast ease-cloth hover:border-zari-700 hover:text-ink"
              >
                {route.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
