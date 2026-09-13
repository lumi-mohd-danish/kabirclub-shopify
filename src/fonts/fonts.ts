import localFont from 'next/font/local';

/**
 * Ink & Zari — two faces, both variable, both self-hosted from `src/fonts/files`.
 *
 * These were previously loaded through `next/font/google`, which downloads the
 * files at BUILD time. That makes every production build depend on Google being
 * reachable from the build machine, and it is a real failure mode: this build
 * started failing with `Failed to fetch 'Fraunces' from Google Fonts` while the
 * same URLs fetched fine from curl and from plain `node -e "fetch(...)"`, so the
 * outage was inside the font loader rather than in the network. A storefront
 * should not be unbuildable because a third party is having a bad day.
 *
 * Serving is unchanged: next/font still self-hosts, emits `--font-display` /
 * `--font-sans`, and generates a size-adjusted fallback to hold layout while the
 * face loads. Only the fetch moved from build time to the repository.
 *
 * Both files are the LATIN subset of the variable face, so one file covers every
 * weight the design uses instead of one file per weight.
 */

/**
 * Fraunces is the display face: warm, high-contrast, hand-cut. It carries
 * `display-1` -> `h2` and nothing else.
 *
 * The file is the `opsz` 9..144 instance, with SOFT and WONK left at their
 * defaults (0 and 0) — tailored rather than artisanal, which is the guardrail
 * that stops this direction tipping into wedding wear.
 *
 * `font-optical-sizing: auto` is the browser default, so `opsz` tracks the
 * rendered size: the 76px hero gets the display cut, a 24px heading does not.
 * The design uses weights 300/400/500 only; that is enforced in the type scale,
 * where every Fraunces `fontSize` token declares its own `fontWeight`.
 */
export const display = localFont({
  src: [
    {
      path: './files/Fraunces-var.woff2',
      style: 'normal'
    }
  ],
  weight: '100 900',
  display: 'swap',
  variable: '--font-display',
  fallback: ['Georgia', 'Times New Roman', 'serif']
});

/**
 * Hanken Grotesk is everything else: UI, body, numerals, buttons, forms, admin.
 * A warm humanist grotesque that holds up at 14-16px, which is where this
 * storefront spends most of its type. The design uses 400/500/600 only.
 */
export const sans = localFont({
  src: [
    {
      path: './files/HankenGrotesk-var.woff2',
      style: 'normal'
    }
  ],
  weight: '100 900',
  display: 'swap',
  variable: '--font-sans',
  fallback: [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ]
});
