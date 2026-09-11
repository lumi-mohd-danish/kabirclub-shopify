import Link from 'next/link';

import { cn } from '@/lib/utils';

import type { FacetValue } from './data';
import { catalogueHref, type CatalogueQuery, type CataloguePatch } from './options';

/**
 * The catalogue's facet rail.
 *
 * EVERY CHIP HERE IS BACKED BY ROWS. The category group is built from the
 * `products.category` values that appear in the current search scope and the
 * size group from the `products.sizes` arrays inside the current category, so
 * the rail can only ever offer a filter that returns something. Nothing is
 * hard-coded: a catalogue with no XL garments shows no XL chip.
 *
 * INTERACTION. Each group opens with an "All" entry, which is both the default
 * state and the way back out — so a shopper who filtered themselves into an
 * empty grid always has a labelled control to undo it, from the keyboard, in
 * the rail itself. The chip that is currently in effect renders as a `<span>`
 * with `aria-current`, exactly as the pagination control marks the page you are
 * on: a link to the page you are already on is a dead control.
 *
 * Server component. It holds no state, only links.
 */

const CHIP_BASE =
  'inline-flex items-center gap-2 rounded-control border px-3 py-1.5 text-body-sm transition-colors duration-fast ease-cloth';
/* Idle chips borrow the metal only as a hairline on hover, and the hover TYPE
   stays ink rather than zari-700: a chip is 14px and zari-700 is only AA from
   16px up. */
const CHIP_IDLE = 'border-line text-ink-muted hover:border-zari-700 hover:text-ink';
/* The selected chip takes an ink fill (16.1:1), not a gold one. Gold is a
   thread in this system and a state marker is not the one filled gold element
   a view is allowed — on a listing page that budget belongs to the empty
   state's primary action. */
const CHIP_ACTIVE = 'border-ink bg-ink font-medium text-paper';

const COUNT_IDLE = 'num text-caption text-ink-muted';
const COUNT_ACTIVE = 'num text-caption text-paper-muted';

/**
 * A category rail is only worth drawing when there is more than one category to
 * choose between: filtering a single-category catalogue down to its only
 * category returns the same grid, which is the definition of a facet that does
 * nothing. Sizes are different — one size chip still narrows the results,
 * because not every garment carries it.
 */
export function hasCategoryFacets(categories: readonly FacetValue[]): boolean {
  return categories.length > 1;
}

/** `requestedSize` keeps the rail visible for a `?size=` nothing stocks. */
export function hasSizeFacets(sizes: readonly FacetValue[], requestedSize?: string): boolean {
  return sizes.length > 0 || Boolean(requestedSize);
}

interface FacetEntry {
  key: string;
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

function FacetGroup({
  id,
  title,
  entries,
  showCounts
}: {
  id: string;
  title: string;
  entries: FacetEntry[];
  showCounts: boolean;
}) {
  if (entries.length <= 1) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 id={id} className="eyebrow text-ink-muted">
        {title}
      </h3>

      <ul aria-labelledby={id} className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li key={entry.key}>
            {entry.active ? (
              <span aria-current="true" className={cn(CHIP_BASE, CHIP_ACTIVE)}>
                <span className="capitalize">{entry.label}</span>
                {showCounts && typeof entry.count === 'number' && (
                  <span className={COUNT_ACTIVE}>{entry.count}</span>
                )}
              </span>
            ) : (
              <Link href={entry.href} className={cn(CHIP_BASE, CHIP_IDLE)}>
                <span className="capitalize">{entry.label}</span>
                {showCounts && typeof entry.count === 'number' && (
                  <span className={COUNT_IDLE}>{entry.count}</span>
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function FacetRail({
  basePath,
  query,
  categories,
  sizes,
  showCounts,
  className
}: {
  /**
   * The route being filtered — `/search`, or `/search/<handle>`. Size links stay
   * on it; category links necessarily leave it, since the category is what they
   * change.
   */
  basePath: string;
  query: CatalogueQuery;
  categories: FacetValue[];
  sizes: FacetValue[];
  showCounts: boolean;
  className?: string;
}) {
  /**
   * Category chips always use the `?category=` form, on both routes.
   *
   * The collection route (`/search/topwear`) is a real, linkable page and stays
   * so — but a rail whose entries switched URL shape halfway through would drop
   * the shopper's `q` and `size` the moment they crossed from one to the other.
   * One shape, one set of preserved filters.
   */
  const categoryEntries: FacetEntry[] = [
    {
      key: 'category-all',
      label: 'All',
      href: catalogueHref('/search', query, { category: undefined }),
      active: !query.category
    },
    ...categories.map((facet) => ({
      key: `category-${facet.value}`,
      label: facet.label,
      href: catalogueHref('/search', query, { category: facet.value }),
      active: Boolean(query.category && query.category.toLowerCase() === facet.value),
      count: facet.count
    }))
  ];

  const sizePatch = (size: string | undefined): CataloguePatch => ({ size });

  const sizeEntries: FacetEntry[] = [
    {
      key: 'size-all',
      label: 'Any',
      href: catalogueHref(basePath, query, sizePatch(undefined)),
      active: !query.size
    },
    ...sizes.map((facet) => ({
      key: `size-${facet.value}`,
      label: facet.label,
      href: catalogueHref(basePath, query, sizePatch(facet.label)),
      active: Boolean(query.size && query.size.toLowerCase() === facet.value),
      count: facet.count
    }))
  ];

  // A size the URL asks for that no product carries still has to appear, or the
  // rail would show "Any" as selected while the grid sits empty.
  if (query.size && !sizeEntries.some((entry) => entry.active)) {
    sizeEntries.push({
      key: `size-${query.size.toLowerCase()}`,
      label: query.size.toUpperCase(),
      href: catalogueHref(basePath, query, sizePatch(query.size)),
      active: true,
      count: 0
    });
  }

  const showCategories = hasCategoryFacets(categories);
  const showSizes = hasSizeFacets(sizes, query.size);

  if (!showCategories && !showSizes) return null;

  return (
    <aside
      aria-labelledby="catalogue-filters-heading"
      /* On lg the rail is a column that stays with the shopper as the grid
         scrolls; below that it is a compact band of chips above the results,
         which is the same markup and needs no disclosure widget to open. */
      className={cn('w-full lg:sticky lg:top-24 lg:w-56 lg:shrink-0', className)}
    >
      <h2 id="catalogue-filters-heading" className="eyebrow text-ink-muted">
        Filter
      </h2>
      <div className="rule-zari mt-3 w-16" aria-hidden="true" />

      <div className="mt-6 flex flex-col gap-7">
        {showCategories && (
          <FacetGroup
            id="catalogue-facet-category"
            title="Category"
            entries={categoryEntries}
            showCounts={showCounts}
          />
        )}
        {showSizes && (
          <FacetGroup
            id="catalogue-facet-size"
            title="Size"
            entries={sizeEntries}
            showCounts={showCounts}
          />
        )}
      </div>
    </aside>
  );
}
