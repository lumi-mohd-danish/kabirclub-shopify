import { DEFAULT_PRODUCTS_PAGE_SIZE, getProducts } from '@/lib/supabase/api';
import type { Product } from '@/lib/supabase/types';

import type { CatalogueQuery } from './options';

/**
 * The catalogue's one data call.
 *
 * It answers three questions in as few round trips as the data layer allows:
 *   1. which products are on this page
 *   2. which categories exist in this scope, and how many products each holds
 *   3. which sizes exist in this scope, and how many products each holds
 *
 * FACETS ARE DERIVED, NEVER INVENTED. Both rails are built from rows that are
 * actually in the table — the `products.category` column and the `products.sizes`
 * array — so every chip in the rail leads somewhere with at least one garment
 * behind it. A facet that returns nothing is worse than no facet at all, which
 * is why there is no colour rail, no fabric rail and no price bracket rail here:
 * the schema has no such columns to derive them from.
 */

/**
 * How many rows the facet scan reads.
 *
 * Ten default pages. Supabase has no distinct-values endpoint and `getProducts`
 * has no size predicate, so the honest way to know which sizes exist is to look
 * at the rows. Bounding it keeps that from turning into a full table read on
 * every listing request.
 *
 * When the scope fits inside this window the scan has seen EVERY matching row,
 * so the counts are exact and the page itself can be sliced straight out of it —
 * one query for the whole view. Past it, the grid falls back to the ranged query
 * it has always used and the rail drops its counts rather than printing numbers
 * it cannot stand behind.
 */
export const FACET_SCAN_LIMIT = DEFAULT_PRODUCTS_PAGE_SIZE * 10;

/** One entry in a facet rail. */
export interface FacetValue {
  /** The value that goes into the URL. */
  value: string;
  /** What the shopper reads. Taken from the data, not title-cased by hand. */
  label: string;
  /** Products behind this facet in the current scope. */
  count: number;
}

export interface CatalogueData {
  /** The products on the requested page. */
  products: Product[];
  /** Matching rows for the current filters — the number pagination is built on. */
  total: number;
  /** Page size actually used. */
  limit: number;
  /** Row offset of the first product on this page. */
  offset: number;
  /** Last page that has rows. Always at least 1. */
  lastPage: number;
  /** Categories present in the current search scope, ignoring the category filter. */
  categories: FacetValue[];
  /** Sizes present in the current category, ignoring the size filter. */
  sizes: FacetValue[];
  /** True when the facet scan saw every row in scope, so the counts are exact. */
  countsAreExact: boolean;
  /** Matching rows before the size facet was applied. Drives the empty-state copy. */
  unfilteredTotal: number;
}

const sameValue = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

const productSizes = (product: Product): string[] =>
  Array.isArray(product.sizes)
    ? product.sizes.map((size) => (typeof size === 'string' ? size.trim() : '')).filter(Boolean)
    : [];

const matchesCategory = (product: Product, category: string): boolean =>
  typeof product.category === 'string' && sameValue(product.category, category);

const matchesSize = (product: Product, size: string): boolean =>
  productSizes(product).some((value) => sameValue(value, size));

/**
 * Garment sizes are an ordered sequence, not an alphabet: S must sit between XS
 * and M, and waist 30 between 28 and 32. Unknown labels keep their relative
 * alphabetical order at the end rather than being dropped.
 */
const SIZE_ORDER = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '2XL',
  'XXXL',
  '3XL',
  'FREE',
  'FREE SIZE',
  'ONE SIZE'
];

const sizeRank = (value: string): number => {
  const index = SIZE_ORDER.indexOf(value.trim().toUpperCase());

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const compareSizes = (a: string, b: string): number => {
  const numericA = Number(a);
  const numericB = Number(b);

  if (Number.isFinite(numericA) && Number.isFinite(numericB)) return numericA - numericB;

  const rankDelta = sizeRank(a) - sizeRank(b);

  return rankDelta === 0 ? a.localeCompare(b) : rankDelta;
};

/**
 * Count distinct values case-insensitively while keeping the first spelling the
 * data used — `products.category` is capitalised ('Topwear') and the URL handle
 * is not, and the rail should read like the catalogue, not like the query string.
 */
function tally(values: readonly string[]): FacetValue[] {
  const byKey: Record<string, FacetValue> = {};
  const facets: FacetValue[] = [];

  values.forEach((raw) => {
    const value = raw.trim();

    if (!value) return;

    const key = value.toLowerCase();
    const existing = byKey[key];

    if (existing) {
      existing.count += 1;

      return;
    }

    const facet: FacetValue = { value: key, label: value, count: 1 };

    byKey[key] = facet;
    facets.push(facet);
  });

  return facets;
}

function categoryFacets(products: readonly Product[]): FacetValue[] {
  const categories = products.map((product) =>
    typeof product.category === 'string' ? product.category : ''
  );

  return tally(categories).sort((a, b) => a.label.localeCompare(b.label));
}

function sizeFacets(products: readonly Product[]): FacetValue[] {
  const sizes: string[] = [];

  products.forEach((product) => {
    productSizes(product).forEach((size) => sizes.push(size));
  });

  return tally(sizes)
    .map((facet) => ({ ...facet, label: facet.label.toUpperCase() }))
    .sort((a, b) => compareSizes(a.label, b.label));
}

/**
 * Load one page of the catalogue plus the facet rails that describe it.
 *
 * The ranged query, the real row count and the page arithmetic are the ones
 * Phase 0 shipped — this only adds the facet scan around them, and only reaches
 * for a second round trip when the scope is genuinely bigger than the scan.
 */
export async function loadCatalogue(
  query: CatalogueQuery,
  { pageSize = DEFAULT_PRODUCTS_PAGE_SIZE }: { pageSize?: number } = {}
): Promise<CatalogueData> {
  const { q, category, size, sort, page } = query;

  // Scanned WITHOUT the category filter on purpose: the category rail has to be
  // able to show the categories you are not currently in, with their real counts.
  const scan = await getProducts({
    query: q,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    page: 0,
    limit: FACET_SCAN_LIMIT
  });

  const countsAreExact = scan.products.length >= scan.total;
  const inCategory = category
    ? scan.products.filter((product) => matchesCategory(product, category))
    : scan.products;

  const categories = categoryFacets(scan.products);
  const sizes = sizeFacets(inCategory);

  // A page number past the end is left to produce an empty slice rather than
  // being clamped here: the view redirects it to the last page that has rows,
  // which is the Phase 0 behaviour and keeps the URL honest.
  const offset = (page - 1) * pageSize;

  // The scan answers the page itself in two cases:
  //
  //   - the scope fits inside the window, so the scan IS the complete, sorted
  //     result set and slicing it is exact — and costs no second query;
  //   - a size was chosen, which the data layer has no predicate for. Past the
  //     window that filter can only be honest about the rows it read, and the
  //     rail says so by dropping its counts.
  if (countsAreExact || size) {
    const pool = size ? inCategory.filter((product) => matchesSize(product, size)) : inCategory;

    return {
      products: pool.slice(offset, offset + pageSize),
      total: pool.length,
      limit: pageSize,
      offset,
      lastPage: Math.max(1, Math.ceil(pool.length / pageSize)),
      categories,
      sizes,
      countsAreExact,
      unfilteredTotal: inCategory.length
    };
  }

  // Otherwise: a catalogue larger than the scan window with no size filter —
  // the ranged query Phase 0 shipped, unchanged, with the real row count.
  const result = await getProducts({
    query: q,
    category,
    sortBy: sort.sortBy,
    sortOrder: sort.sortOrder,
    page: page - 1,
    limit: pageSize
  });

  const limit = result.limit || pageSize;

  return {
    products: result.products,
    total: result.total,
    limit,
    offset: result.offset,
    lastPage: Math.max(1, Math.ceil(result.total / limit)),
    categories,
    sizes,
    countsAreExact,
    unfilteredTotal: result.total
  };
}
