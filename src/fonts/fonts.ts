import { Fraunces, Hanken_Grotesk } from 'next/font/google';

/**
 * Ink & Zari — two faces, both variable, both self-hosted by next/font.
 *
 * Fraunces is the display face: warm, high-contrast, hand-cut. It carries
 * `display-1` -> `h2` and nothing else.
 *
 * `axes: ['opsz']` is deliberate and is the payload control. Requesting only
 * the optical-size axis makes Google instance the file with SOFT and WONK
 * pinned at their defaults (0 and 0) — tailored rather than artisanal, which
 * is the guardrail that stops this direction tipping into wedding wear. It
 * also drops the latin woff2 from ~120KB to a measured 67.4KB.
 *
 * `weight` is intentionally NOT set. next/font/google rejects `weight`
 * together with `axes` (see get-font-axes.js: axes only apply when the font
 * resolves to the variable instance), and a variable face is one file at any
 * weight, so pinning weights would cost bytes rather than save them. The
 * "300/400/500 only" constraint is instead enforced in the type scale —
 * every `theme.extend.fontSize` token that uses Fraunces declares its own
 * fontWeight, and no call site should reach past 500.
 *
 * `font-optical-sizing: auto` is the browser default, so opsz tracks the
 * rendered size: the 76px hero gets the display cut, a 24px heading does not.
 */
export const display = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-display',
  fallback: ['Georgia', 'Times New Roman', 'serif']
});

/**
 * Hanken Grotesk is everything else: UI, body, numerals, buttons, forms,
 * admin. A warm humanist grotesque that holds up at 14-16px, which is where
 * this storefront spends most of its type. Variable, 34.7KB latin woff2; the
 * design uses 400/500/600 only.
 */
export const sans = Hanken_Grotesk({
  subsets: ['latin'],
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
