const plugin = require('tailwindcss/plugin');

/**
 * Ink & Zari — the KabirClub design tokens.
 *
 * Two grounds alternate: warm PAPER for the catalogue, deep warm INK for the
 * editorial bands (header, hero, promo, footer, auth, cart, admin). ZARI is the
 * metal thread — it appears as 1px rules, eyebrows, links and prices, and as
 * exactly one filled element per view (the primary CTA). It is never an area.
 *
 * GOLD IS SURFACE-DEPENDENT. This is the one rule that cannot be broken:
 *   on paper (light)  gold text MUST be zari-700 (#8A6410, 4.85:1 at >=16px).
 *                     zari-500 on paper is 1.96:1 and is banned as text.
 *   on ink   (dark)   gold text is zari-500 (8.47:1) or zari-300 (11.34:1).
 *   filled gold       bg-zari-500 + text-ink = 8.16:1. NEVER white on gold
 *                     (1.58:1) — that was the bug Phase 0 fixed.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* INK — warm charcoal, red/yellow bias, never blue-black.
           `ink` alone is the text colour; the numeric steps are surfaces. */
        ink: {
          DEFAULT: '#1C1714', // primary text on paper, 16.0:1
          900: '#171310', // band / header / footer / cart / admin ground
          800: '#211B16', // raised surface on ink: cards, rows, field wells
          700: '#2E2620', // hairline on ink (replaces border-gray-700/800)
          600: '#3D332B', // input border on ink, disabled fill
          muted: '#6B5F52', // secondary body on paper, 5.61:1
          faint: '#8A7C6C' // meta / eyebrow on paper, 3.66:1 -> >=16px only
        },

        /* PAPER — warm off-white. `paper` alone is the document ground. */
        paper: {
          DEFAULT: '#F7F3EC', // catalogue, PDP, account, checkout. 16.6:1 on ink-900
          raised: '#FFFCF7', // cards / panels that sit above paper
          sunk: '#EFE8DE', // the image mat — every product photo sits on this
          muted: '#BEB2A4' // secondary text on ink, 8.81:1
        },

        /* Hairlines on paper. 1px is the whole border system. */
        line: {
          DEFAULT: '#E2D9CC',
          strong: '#CFC2B0' // table rules, selected borders
        },

        /* ZARI — the metal. Four steps, one job each. */
        zari: {
          300: '#EBC77E', // 11.34:1 on ink — gold type over photography, cart Total
          500: '#D8A94B', // accent on INK only + every gold fill. 8.47:1 on ink-900
          600: '#B98A2A', // hover / press of gold fills. ink on it = 5.66:1
          700: '#8A6410' // the metal for PAPER: prices, links. 4.85:1 at >=16px
        },

        /* STATE — heritage-derived, so colour carries information. */
        madder: '#9A3324', // errors, destructive, sale price. 6.61:1 on paper
        neem: '#2F5D45', // success / in-stock (replaces every WhatsApp green-600)
        haldi: '#B4842B' // warning / pending only (admin, order status)
      },

      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'], // Fraunces
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'] // Hanken Grotesk
        // The `lora` / `quicksand` aliases are deleted. The comment here used
        // to claim 26 + 3 un-migrated call sites; the migration is finished and
        // a repo-wide grep for `font-lora` / `font-quicksand` now returns zero,
        // so `font-display` and `font-sans` above are the only two families.
      },

      /* One numeric type scale. Replaces the eight one-off clamp() expressions
         and the competing breakpoint ladders. Fraunces (`font-display`) is for
         display-1 -> h2 only; h3 and below are Hanken. Nothing below 16px in a
         form field or a body paragraph. `text-eyebrow` needs `.eyebrow` (or
         `uppercase`) and `text-price`/`text-price-lg` need `.num`, because
         text-transform and font-variant-numeric are not fontSize properties. */
      fontSize: {
        'display-1': [
          'clamp(40px, 30px + 3.2vw, 76px)',
          { lineHeight: '1.02', letterSpacing: '-0.025em', fontWeight: '300' }
        ],
        'display-2': [
          'clamp(32px, 24px + 2.4vw, 56px)',
          { lineHeight: '1.06', letterSpacing: '-0.02em', fontWeight: '300' }
        ],
        h1: [
          'clamp(28px, 22px + 1.6vw, 40px)',
          { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '400' }
        ],
        h2: [
          'clamp(24px, 20px + 1.1vw, 32px)',
          { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '400' }
        ],
        h3: ['20px', { lineHeight: '1.25', letterSpacing: '-0.005em', fontWeight: '500' }],
        lead: ['clamp(17px, 16px + 0.3vw, 20px)', { lineHeight: '1.55', letterSpacing: '0em' }],
        body: ['16px', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.55', letterSpacing: '0.005em', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '1.45', letterSpacing: '0.01em', fontWeight: '500' }],
        eyebrow: ['11px', { lineHeight: '1.2', letterSpacing: '0.18em', fontWeight: '600' }],
        price: [
          'clamp(18px, 16px + 0.5vw, 22px)',
          { lineHeight: '1', letterSpacing: '0em', fontWeight: '500' }
        ],
        'price-lg': [
          'clamp(24px, 20px + 1vw, 32px)',
          { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '400' }
        ]
      },

      /* Plates have hairlines, not radii. `rounded-plate` (0) for product
         plates and cards, `rounded-control` (3px) for buttons/inputs/chips,
         `rounded-pill` for avatars and the cart badge only. */
      borderRadius: {
        DEFAULT: '3px',
        xs: '2px',
        control: '3px',
        plate: '0px',
        pill: '9999px'
      },

      /* Two shadows, both warm-tinted. A plate at rest gets neither. */
      boxShadow: {
        card: '0 1px 2px rgba(28, 23, 20, 0.04), 0 8px 24px -12px rgba(28, 23, 20, 0.1)',
        overlay: '0 24px 64px -24px rgba(23, 19, 16, 0.55)'
      },

      /* Cloth, not UI: fabric settles, it does not bounce. Colour transitions
         use `duration-fast`, transforms the 240ms DEFAULT, panels
         `duration-panel`, image reveals `duration-reveal`. `transition-all`
         is banned — narrow to transition-colors / transition-transform. */
      transitionDuration: {
        DEFAULT: '240ms',
        fast: '160ms',
        panel: '420ms',
        reveal: '520ms'
      },
      transitionTimingFunction: {
        cloth: 'cubic-bezier(0.22, 0.61, 0.36, 1)'
      },

      keyframes: {
        /* Loading dots — src/components/common/loading-dots.tsx */
        blink: {
          '0%': { opacity: '0.2' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0.2' }
        },
        /* Header submenu — src/components/sections/Header/SubMenu.tsx */
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0px)' }
        },
        /* The cloth reveal: images wipe up rather than fade. Pair with
           `animation-delay-[Nms]`, capped at Math.min(index, 6) * 40ms. */
        clothReveal: {
          '0%': { clipPath: 'inset(0 0 100% 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' }
        }
      },
      animation: {
        blink: 'blink 1.4s both infinite',
        fadeUp: 'fadeUp 0.5s ease-out forwards',
        fadeUpDelay: '0.5s ease-out 0.25s forwards fadeUp',
        clothReveal: 'clothReveal 520ms cubic-bezier(0.22, 0.61, 0.36, 1) both'
      }
    }
  },
  future: {
    hoverOnlyWhenSupported: true
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'animation-delay': (value) => {
            return {
              'animation-delay': value
            };
          }
        },
        {
          values: theme('transitionDelay')
        }
      );
    })
  ]
};
