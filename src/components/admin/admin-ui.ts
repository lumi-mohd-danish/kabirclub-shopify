/**
 * The admin control vocabulary — one copy, not five.
 *
 * Every /admin page had grown its own `BTN_GOLD` / `BTN_GHOST` / `LABEL`
 * constant block, and they had already drifted: three different paddings for
 * the same ghost button, two different table-cell rhythms, and banners built
 * by hand out of `bg-neem` / `bg-madder` on three pages while a fourth used
 * the shared `.banner` recipe.
 *
 * DENSITY. Admin is a tool, not an editorial surface. It takes the same Ink &
 * Zari tokens as the storefront but at TIGHT density:
 *   - table rows are 40px (`TR` = `h-10`, cells at `py-1`),
 *   - meta type is 13px (`text-caption`), never the storefront body scale,
 *   - buttons are `py-2`, not the storefront's `py-4`,
 *   - headings come from `<AdminPageHeader>` -> `SectionHeading density="compact"`.
 *
 * FORM FIELDS ARE THE ONE EXCEPTION: `.field-ink` stays at `text-body` (16px).
 * Anything smaller triggers the iOS focus zoom, so density stops at the field
 * border and the padding (`py-2`) is all that tightens.
 *
 * COLOUR. The ink grounds are `ink-900` (page), `ink-800` (plate) and
 * `ink-700` (hairline / row hover). Gold is surface-dependent: on these ink
 * grounds it is `zari-500`, and it appears as exactly ONE filled element per
 * screen — the primary action. `madder` is 2.53:1 as text on ink and so is
 * never coloured type here; destructive controls stay neutral at rest and take
 * a madder FILL on hover/focus, where paper on madder is 6.61:1.
 */

/* -- Catalogue vocabulary -------------------------------------------------- */

/**
 * The categories and sizes the catalogue offers. They live here rather than in
 * `<ProductForm>` so the products listing can filter by category without
 * pulling the whole form — Headless UI, the uploader and all — into its bundle.
 */
export const PRODUCT_CATEGORIES = ['Topwear', 'Bottomwear', 'Accessories', 'Footwear'];
export const PRODUCT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

/* -- Plates ---------------------------------------------------------------- */

/** The standard admin plate: a raised ink surface inside an ink-700 hairline. */
export const PLATE = 'border border-ink-700 bg-ink-800';

/** A well inside a plate — one step darker, for nested panels and table heads. */
export const PLATE_SUNK = 'border border-ink-700 bg-ink-900';

/* -- Buttons --------------------------------------------------------------- */

/**
 * The single filled gold element on a screen. `.btn` carries the fill and the
 * press; the utilities here only tighten it to tool density.
 */
export const BTN_PRIMARY =
  'btn px-4 py-2 text-body-sm disabled:cursor-not-allowed disabled:border-transparent disabled:bg-ink-600 disabled:text-paper';

/** Hairline ghost on ink. Everything that is not the one primary action. */
export const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-4 py-2 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

/** The same ghost at chip scale, for pagination and in-row controls. */
export const BTN_GHOST_SM =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-2.5 py-1 text-caption font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Confirmed destruction — the button inside the confirm dialog, never a row
 * control. paper on madder is 6.61:1.
 */
export const BTN_DANGER =
  'inline-flex items-center justify-center gap-2 rounded-control border border-transparent bg-madder px-4 py-2 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-madder/90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

/** In-row destructive chip: neutral at rest, madder fill on hover/focus. */
export const CHIP_DANGER =
  'inline-flex items-center justify-center rounded-control border border-ink-faint px-2 py-0.5 text-caption font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:border-madder hover:bg-madder focus-visible:border-madder focus-visible:bg-madder active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

/** In-row restorative chip — the inverse of CHIP_DANGER. */
export const CHIP_POSITIVE =
  'inline-flex items-center justify-center rounded-control border border-ink-faint px-2 py-0.5 text-caption font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:border-neem hover:bg-neem focus-visible:border-neem focus-visible:bg-neem active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

/* -- Toggles --------------------------------------------------------------- */

/**
 * A selected toggle takes the gold EDGE and a lifted well, never a gold fill:
 * the fill is spoken for by the one primary action on the screen.
 */
export const TOGGLE = 'rounded-control border transition-colors duration-fast ease-cloth';
export const TOGGLE_ON = 'border-zari-500 bg-ink-700 text-paper';
export const TOGGLE_OFF =
  'border-ink-faint text-paper-muted hover:border-paper-muted hover:text-paper';

/* -- Forms ----------------------------------------------------------------- */

/** Field label. Every one of these is paired with an `id` on its control. */
export const LABEL = 'eyebrow mb-2 block text-paper-muted';

/** Help text under a field. */
export const HINT = 'mt-2 text-caption text-paper-muted';

/**
 * An inline field error. madder is 2.53:1 as TEXT on ink, so the state is
 * carried as a filled pill (paper on madder, 6.61:1) rather than coloured type.
 */
export const INLINE_ERROR =
  'mt-2 inline-block rounded-control bg-madder px-2 py-0.5 text-caption text-paper';

/** Field well at tool density. The 16px type inside `.field-ink` is untouched. */
export const FIELD = 'field-ink py-2';

/* -- Tables ---------------------------------------------------------------- */

export const TABLE_HEAD = 'border-b border-ink-700 bg-ink-900';

/** Always paired with `scope="col"` at the call site. */
export const TH = 'eyebrow whitespace-nowrap px-3 py-2 text-left text-paper-muted';

/** 40px rows: `h-10` plus `py-1` cells. */
export const TR = 'h-10 transition-colors duration-fast ease-cloth hover:bg-ink-700';

export const TD = 'whitespace-nowrap px-3 py-1 text-caption text-paper';
export const TD_MUTED = 'whitespace-nowrap px-3 py-1 text-caption text-paper-muted';

/* -- Status chips ---------------------------------------------------------- */

const STATUS_CHIP = 'eyebrow inline-block rounded-control px-2 py-0.5';

/** Live / hidden, as a fill so the label never becomes coloured type on ink. */
export const CHIP_ACTIVE = `${STATUS_CHIP} bg-neem text-paper`;
export const CHIP_INACTIVE = `${STATUS_CHIP} bg-madder text-paper`;

/* -- Messages -------------------------------------------------------------- */

export type AdminMessage = { type: 'success' | 'error'; text: string };

/**
 * `.banner` sets no text colour — it inherits, which is exactly what makes one
 * class work on both grounds. On these ink pages it inherits `paper`.
 */
export const bannerClass = (type: AdminMessage['type']): string =>
  `banner ${type === 'success' ? 'banner-success' : 'banner-error'}`;

/* -- Helpers --------------------------------------------------------------- */

/** Narrows an unknown throw to something worth showing a human. */
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
