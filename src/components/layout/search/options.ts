import type { SearchParamsRecord } from '@/components/grid';

/**
 * The catalogue's URL contract.
 *
 * `/search` and `/search/[collection]` render the SAME listing. They differ only
 * in where the category comes from — a query parameter on one, the path segment
 * on the other — so every piece of parsing and every link builder lives here
 * once instead of being re-derived (and quietly diverging) in two page files.
 *
 * This module is deliberately free of server-only imports: the sort control is
 * a client component and needs `SORT_OPTIONS`, so nothing here may drag the
 * Supabase client into the browser bundle. The one import is a type, which is
 * erased at compile time.
 *
 * FOUR PARAMETERS, AND NO OTHERS: `q`, `category`, `size`, `sort` (plus `page`,
 * which the pagination control owns). Links are rebuilt from the parsed values
 * rather than by copying whatever the incoming URL happened to carry, so a
 * stray parameter can never be propagated across a whole page of hrefs.
 */

export type SortOrder = 'asc' | 'desc';

/** A column the data layer will actually sort by. */
export type SortColumn = 'created_at' | 'price';

export interface SortOption {
  /** Visible label in the sort control. */
  readonly label: string;
  /** The `?sort=` slug. These slugs are linked to from the header, the footer,
      the hero and the 404 page, so they are part of the public URL contract. */
  readonly value: string;
  readonly sortBy: SortColumn;
  readonly sortOrder: SortOrder;
}

const LATEST: SortOption = {
  label: 'Latest',
  value: 'created_at-desc',
  sortBy: 'created_at',
  sortOrder: 'desc'
};

const OLDEST: SortOption = {
  label: 'Oldest',
  value: 'created_at-asc',
  sortBy: 'created_at',
  sortOrder: 'asc'
};

const PRICE_LOW_TO_HIGH: SortOption = {
  label: 'Price: Low to High',
  value: 'price-asc',
  sortBy: 'price',
  sortOrder: 'asc'
};

const PRICE_HIGH_TO_LOW: SortOption = {
  label: 'Price: High to Low',
  value: 'price-desc',
  sortBy: 'price',
  sortOrder: 'desc'
};

export const SORT_OPTIONS: readonly SortOption[] = [
  LATEST,
  OLDEST,
  PRICE_LOW_TO_HIGH,
  PRICE_HIGH_TO_LOW
];

/** What an absent or unrecognised `?sort=` resolves to. */
export const DEFAULT_SORT = LATEST;

/**
 * Resolve `?sort=` against the options the control actually offers.
 *
 * Anything that is not one of the four slugs falls back to Latest, INCLUDING
 * slugs the data layer could technically honour (`title-asc`). That is the
 * point: the select and the result set must agree, and an option the control
 * cannot display is an option the shopper cannot undo.
 */
export function resolveSort(value: string | undefined): SortOption {
  return SORT_OPTIONS.find((option) => option.value === value) ?? DEFAULT_SORT;
}

/** Query strings can repeat a key (`?q=a&q=b`); take the first usable value. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();

  return trimmed ? trimmed : undefined;
}

/** 1-based page number from the URL; anything invalid is page 1. */
export function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/**
 * A size is echoed back into headings and empty-state copy, so it is clamped
 * here. Anything longer than this is not a garment size, it is someone testing
 * what the page will repeat back to them.
 */
const MAX_SIZE_LENGTH = 16;

export interface CatalogueQuery {
  /** Free-text search, `?q=`. */
  q?: string;
  /** Category filter. `?category=` on /search, the path segment on a collection. */
  category?: string;
  /** Size facet, `?size=`. */
  size?: string;
  /** Always resolved — never undefined, so no call site has to default it. */
  sort: SortOption;
  /** 1-based page number. */
  page: number;
  /**
   * True on `/search/[collection]`, where the category is the route rather than
   * a parameter. Link builders omit `category` in that case, so the collection
   * URL stays clean and can never carry a contradictory `?category=`.
   */
  categoryLocked: boolean;
}

export function parseCatalogueQuery(
  searchParams: SearchParamsRecord | undefined,
  /** Supplied by the collection route, where the path owns the category. */
  options: { category?: string } = {}
): CatalogueQuery {
  const params = searchParams ?? {};
  const lockedCategory = options.category?.trim();
  const size = firstParam(params.size);

  return {
    q: firstParam(params.q),
    category: lockedCategory || firstParam(params.category),
    size: size ? size.slice(0, MAX_SIZE_LENGTH) : undefined,
    sort: resolveSort(firstParam(params.sort)),
    page: parsePage(firstParam(params.page)),
    categoryLocked: Boolean(lockedCategory)
  };
}

/** The keys a catalogue link may carry. `page` is owned by `GridPagination`. */
export type CataloguePatch = Partial<
  Record<'q' | 'category' | 'size' | 'sort', string | undefined>
>;

/**
 * The normalised query record every link on the page is built from.
 *
 * Keys are emitted in a fixed order so two routes that mean the same thing
 * produce the same URL, and the default sort is omitted entirely so the
 * canonical listing URL stays `/search` rather than `/search?sort=created_at-desc`.
 */
export function catalogueSearchParams(
  query: CatalogueQuery,
  patch: CataloguePatch = {}
): SearchParamsRecord {
  const merged = {
    q: 'q' in patch ? patch.q : query.q,
    category:
      'category' in patch ? patch.category : query.categoryLocked ? undefined : query.category,
    size: 'size' in patch ? patch.size : query.size,
    sort: 'sort' in patch ? patch.sort : query.sort.value
  };

  const record: SearchParamsRecord = {};

  if (merged.q) record.q = merged.q;
  if (merged.category) record.category = merged.category;
  if (merged.size) record.size = merged.size;
  if (merged.sort && merged.sort !== DEFAULT_SORT.value) record.sort = merged.sort;

  return record;
}

/**
 * Build a catalogue URL.
 *
 * `page` is never carried over: changing a facet or the sort re-shuffles the
 * result set, so keeping the shopper on page 7 of a different list is how a
 * listing page ends up showing a blank grid.
 */
export function catalogueHref(
  basePath: string,
  query: CatalogueQuery,
  patch: CataloguePatch = {}
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(catalogueSearchParams(query, patch))) {
    if (typeof value === 'string') params.set(key, value);
  }

  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}
