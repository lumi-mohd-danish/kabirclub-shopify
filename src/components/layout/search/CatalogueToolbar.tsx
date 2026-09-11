import Link from 'next/link';

import SortSelect, { type SortSelectOption } from './SortSelect';
import { catalogueHref, SORT_OPTIONS, type CatalogueQuery } from './options';

/**
 * The row above the grid: what you are looking at on the left, how it is
 * ordered on the right, and — only when something is actually narrowing the
 * results — a line of removable filter chips underneath.
 *
 * Both listing routes render this one component. The sort row used to be
 * assembled separately on each of them, which is how they ended up with the
 * same four options behind two different controls.
 */

const CLEAR_CHIP =
  'inline-flex items-center gap-2 rounded-control border border-line-strong px-3 py-1.5 text-body-sm text-ink-muted transition-colors duration-fast ease-cloth hover:border-zari-700 hover:text-ink';

interface ActiveFilterChip {
  key: string;
  label: string;
  href: string;
  /** What a screen reader hears instead of a bare glyph. */
  srLabel: string;
  /** Only for values the catalogue owns (a category), never for shopper input. */
  capitalise?: boolean;
}

function ClearIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function CatalogueToolbar({
  basePath,
  query,
  total,
  rangeStart,
  rangeEnd,
  itemLabel
}: {
  basePath: string;
  query: CatalogueQuery;
  /** Matching rows. Only rendered for a non-empty result, so it is never 0. */
  total: number;
  rangeStart: number;
  rangeEnd: number;
  itemLabel: string;
}) {
  const sortOptions: SortSelectOption[] = SORT_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
    href: catalogueHref(basePath, query, { sort: option.value })
  }));

  /* The category is not offered as a removable chip on a collection route: there
     the category IS the page, and the way out of it is the rail's "All", not a
     control that would strand the shopper on a URL whose path still says
     otherwise. */
  const chips: ActiveFilterChip[] = [
    query.q
      ? {
          key: 'q',
          // NOT `capitalize`: this is the shopper's own typing echoed back, and
          // title-casing it would misquote them.
          label: `Search: “${query.q}”`,
          href: catalogueHref(basePath, query, { q: undefined }),
          srLabel: `Clear the search for ${query.q}`
        }
      : null,
    query.category && !query.categoryLocked
      ? {
          key: 'category',
          label: `Category: ${query.category}`,
          href: catalogueHref(basePath, query, { category: undefined }),
          srLabel: `Clear the ${query.category} category filter`,
          capitalise: true
        }
      : null,
    query.size
      ? {
          key: 'size',
          label: `Size: ${query.size.toUpperCase()}`,
          href: catalogueHref(basePath, query, { size: undefined }),
          srLabel: `Clear the size ${query.size.toUpperCase()} filter`
        }
      : null
  ].filter((chip): chip is ActiveFilterChip => Boolean(chip));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        {/* `.num` is required on every figure in this system: tabular numerals
            stop the range shuffling as the shopper pages through. */}
        <p className="num text-body-sm text-ink-muted">
          Showing {rangeStart}&ndash;{rangeEnd} of {total} {itemLabel}
        </p>

        <SortSelect options={sortOptions} value={query.sort.value} />
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <p id="catalogue-active-filters" className="eyebrow text-ink-muted">
            Applied
          </p>
          <ul
            aria-labelledby="catalogue-active-filters"
            className="flex flex-wrap items-center gap-2"
          >
            {chips.map((chip) => (
              <li key={chip.key}>
                <Link href={chip.href} className={CLEAR_CHIP}>
                  <span className={chip.capitalise ? 'capitalize' : undefined}>{chip.label}</span>
                  <ClearIcon />
                  <span className="sr-only">{chip.srLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
