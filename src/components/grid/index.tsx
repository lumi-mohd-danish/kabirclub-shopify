import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * The product-listing kit.
 *
 * `Grid` is the ONLY grid in the listing stack. `ProductGridItems` renders bare
 * `<Grid.Item>` (`<li>`) children straight into it, so a page never nests a
 * second grid inside this one — that nesting is what collapsed cards into a
 * ~70px column on every breakpoint above `sm`.
 *
 * `GridPagination` and `GridEmptyState` live here so the search page and the
 * collection page share one implementation instead of each growing its own.
 */

export type SearchParamsRecord = { [key: string]: string | string[] | undefined };

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

function Grid({ className, children, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      {...props}
      // Column classes are merged with `cn` (tailwind-merge), so a caller's
      // `grid-cols-*` actually replaces the default instead of racing it in
      // the stylesheet.
      // Asymmetric gutters - tight horizontal, generous vertical - are what
      // make a catalogue read as editorial rather than as a table. 2-up on
      // phones, never 1-up.
      className={cn(
        'grid w-full list-none grid-cols-2 gap-x-4 gap-y-10 p-0 md:grid-cols-3 md:gap-x-6 md:gap-y-14 xl:grid-cols-4',
        className
      )}
    >
      {children}
    </ul>
  );
}

function GridItem({ className, children, ...props }: React.ComponentProps<'li'>) {
  return (
    <li {...props} className={cn('flex h-full w-full', className)}>
      {children}
    </li>
  );
}

Grid.Item = GridItem;

export default Grid;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Rebuild the current URL for a different page, preserving every other query
 * parameter (`q`, `category`, `sort`, …). Page 1 is the canonical URL, so it
 * never carries a `page` parameter.
 */
export function buildPageHref(
  basePath: string,
  searchParams: SearchParamsRecord | undefined,
  page: number
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === 'page' || value === undefined) continue;

    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
    } else {
      params.append(key, value);
    }
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
}

/** How many numbered page pills sit in the sliding window around the current page. */
const PAGE_WINDOW_SIZE = 5;

function buildPageList(currentPage: number, totalPages: number): (number | 'gap')[] {
  const size = Math.min(PAGE_WINDOW_SIZE, totalPages);
  const start = Math.max(1, Math.min(currentPage - Math.floor(size / 2), totalPages - size + 1));
  const window = Array.from({ length: size }, (_, index) => start + index);

  const items: (number | 'gap')[] = [];

  if (start > 1) {
    items.push(1);
    if (start > 2) items.push('gap');
  }

  items.push(...window);

  const lastInWindow = start + size - 1;

  if (lastInWindow < totalPages) {
    if (lastInWindow < totalPages - 1) items.push('gap');
    items.push(totalPages);
  }

  return items;
}

/*
 * Paging controls sit on the catalogue's PAPER ground.
 *
 * The current page is marked with an ink fill, not a gold one. Gold is a
 * thread here: exactly one filled gold element is allowed per view and on a
 * listing page that budget belongs to a real action (the empty state's primary
 * CTA), not to a state marker. Idle pills borrow the metal only as a hairline
 * on hover, and the hover TYPE stays `ink` rather than `zari-700` because
 * these pills are 14px and zari-700 is only AA at 16px and up.
 */
const PILL_BASE =
  'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-control px-3 text-body-sm font-medium transition-colors duration-fast ease-cloth';
const PILL_IDLE = 'border border-line text-ink-muted hover:border-zari-700 hover:text-ink';
const PILL_ACTIVE = 'border border-ink bg-ink text-paper';
/* Disabled prev/next. `ink-faint` is 3.67:1, which normal-size text may not
   use - but these are `aria-hidden` inactive controls, which WCAG 1.4.3
   exempts, and dimming them is the only thing that says "unavailable". */
const PILL_INACTIVE = 'border border-line text-ink-faint';

function ChevronLeft() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/**
 * Paging controls driven by the real row count the data layer reports.
 * Renders nothing when everything already fits on one page.
 */
export function GridPagination({
  basePath,
  searchParams,
  total,
  limit,
  offset,
  itemLabel = 'products'
}: {
  basePath: string;
  searchParams?: SearchParamsRecord;
  /** True number of matching rows, not the length of the current page. */
  total: number;
  limit: number;
  offset: number;
  itemLabel?: string;
}) {
  const pageSize = Math.max(1, Math.floor(limit) || 1);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));

  if (totalPages <= 1) return null;

  const currentPage = Math.min(totalPages, Math.floor(Math.max(0, offset) / pageSize) + 1);
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);
  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex w-full flex-col items-center gap-4">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {currentPage > 1 ? (
            <Link
              href={buildPageHref(basePath, searchParams, currentPage - 1)}
              rel="prev"
              aria-label="Go to previous page"
              className={cn(PILL_BASE, PILL_IDLE)}
            >
              <ChevronLeft />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(PILL_BASE, PILL_INACTIVE)}>
              <ChevronLeft />
              <span className="hidden sm:inline">Previous</span>
            </span>
          )}
        </li>

        {pages.map((entry, index) =>
          entry === 'gap' ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1 text-body-sm text-ink-faint"
            >
              &hellip;
            </li>
          ) : (
            <li key={entry}>
              {entry === currentPage ? (
                <span aria-current="page" className={cn(PILL_BASE, PILL_ACTIVE)}>
                  {entry}
                </span>
              ) : (
                <Link
                  href={buildPageHref(basePath, searchParams, entry)}
                  aria-label={`Go to page ${entry}`}
                  className={cn(PILL_BASE, PILL_IDLE)}
                >
                  {entry}
                </Link>
              )}
            </li>
          )
        )}

        <li>
          {currentPage < totalPages ? (
            <Link
              href={buildPageHref(basePath, searchParams, currentPage + 1)}
              rel="next"
              aria-label="Go to next page"
              className={cn(PILL_BASE, PILL_IDLE)}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight />
            </Link>
          ) : (
            <span aria-hidden="true" className={cn(PILL_BASE, PILL_INACTIVE)}>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight />
            </span>
          )}
        </li>
      </ul>

      <p className="num text-body-sm text-ink-muted">
        Showing {rangeStart}&ndash;{rangeEnd} of {total} {itemLabel}
      </p>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export interface EmptyStateLink {
  title: string;
  href: string;
}

export interface EmptyStateAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

function NoResultsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M8.5 11h5" />
      <path d="m20.5 20.5-4-4" />
    </svg>
  );
}

/*
 * The empty state's actions are the one place on a listing page that earns the
 * filled gold element, so they use the shared button recipes verbatim:
 * `.btn-primary` is `bg-zari-500` + `text-ink` (8.16:1), `.btn-secondary` is a
 * bare ink hairline. Both already carry the geometry, the press and the
 * timing, so there is no local ACTION_BASE any more.
 */
const ACTION_PRIMARY = 'btn-primary';
const ACTION_SECONDARY = 'btn-secondary';

/**
 * The state most visitors of a broken catalogue actually saw. It has to explain
 * what happened and give a way out, not print one unstyled line.
 */
export function GridEmptyState({
  title,
  message,
  suggestions = [],
  suggestionsLabel = 'Browse instead',
  actions = [],
  icon
}: {
  title: string;
  message: string;
  suggestions?: EmptyStateLink[];
  suggestionsLabel?: string;
  actions?: EmptyStateAction[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-6 rounded-plate border border-line bg-paper-raised px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-pill border border-line-strong bg-paper-sunk text-ink-muted">
        {icon ?? <NoResultsIcon />}
      </span>

      <div className="flex max-w-[62ch] flex-col items-center gap-3">
        <h2 className="font-display text-h2 text-ink">{title}</h2>
        <div className="rule-zari w-16" aria-hidden="true" />
        <p className="text-lead text-ink-muted">{message}</p>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <p className="eyebrow text-ink-muted">{suggestionsLabel}</p>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion.href}>
                <Link
                  href={suggestion.href}
                  className="inline-flex items-center rounded-control border border-line px-4 py-2 text-body-sm capitalize text-ink-muted transition-colors duration-fast ease-cloth hover:border-zari-700 hover:text-ink"
                >
                  {suggestion.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => (
            <Link
              key={`${action.variant ?? 'primary'}-${action.href}`}
              href={action.href}
              className={cn(action.variant === 'secondary' ? ACTION_SECONDARY : ACTION_PRIMARY)}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
