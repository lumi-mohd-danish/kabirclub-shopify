import { GridEmptyState, type EmptyStateAction, type EmptyStateLink } from '@/components/grid';

import { catalogueHref, type CatalogueQuery } from './options';

/**
 * The one empty state both listing routes use.
 *
 * THIS IS THE PAGE MANY VISITORS ACTUALLY SAW. A collection that has sold
 * through, a size nobody stocks, a misspelt search — each of them landed on a
 * bare line of text, and the catalogue's own review found that the collection
 * case was the most-viewed screen on the site. So it is built like a screen:
 * it names what happened, in the shopper's own terms, and it always offers a
 * labelled route back — first the narrowest undo (drop the size, drop the
 * search), then the catalogue, then home.
 *
 * Copy is chosen by cause, narrowest first, because the narrowest cause is the
 * one the shopper can fix.
 */

export type CatalogueScope =
  | { kind: 'catalogue' }
  | { kind: 'collection'; title: string }
  | { kind: 'category'; title: string };

/** An empty clothes rail — the collection equivalent of "no search results". */
function EmptyRailIcon() {
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
      <path d="M6 7h12l1.5 13h-15L6 7Z" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
      <path d="M9.5 12.5h5" />
    </svg>
  );
}

export default function CatalogueEmptyState({
  basePath,
  query,
  scope,
  suggestions,
  unfilteredTotal
}: {
  basePath: string;
  query: CatalogueQuery;
  scope: CatalogueScope;
  /** Other collections to offer. Empty when none exist. */
  suggestions: EmptyStateLink[];
  /**
   * Products in this scope BEFORE the size facet. Zero means the size is not
   * what emptied the page, so blaming it would send the shopper to clear a
   * filter that changes nothing.
   */
  unfilteredTotal: number;
}) {
  const size = unfilteredTotal > 0 ? query.size?.toUpperCase() : undefined;
  const inScope = scope.kind === 'catalogue' ? '' : ` in ${scope.title}`;

  const backToCatalogue: EmptyStateAction = {
    label: 'View all products',
    href: '/search',
    variant: 'secondary'
  };
  const backHome: EmptyStateAction = { label: 'Back to home', href: '/', variant: 'secondary' };

  /**
   * One undo, then one way out — and never the same URL twice.
   *
   * Clearing the search on `/search` and "View all products" are the same href,
   * and offering both would give the shopper two buttons that do one thing (and
   * hand React two identical keys). So the fallbacks are tried in order and the
   * first one that goes somewhere new is taken.
   */
  const withWayOut = (primary: EmptyStateAction): EmptyStateAction[] => {
    const actions: EmptyStateAction[] = [primary];

    [backToCatalogue, backHome].forEach((candidate) => {
      const alreadyThere = actions.some((action) => action.href === candidate.href);

      if (actions.length < 2 && !alreadyThere) actions.push(candidate);
    });

    return actions;
  };

  // A size filter is the narrowest, most recoverable cause, so it is answered
  // first even when a search or a collection is also in play.
  if (size) {
    return (
      <GridEmptyState
        icon={<EmptyRailIcon />}
        title={`Nothing in size ${size}${inScope} right now`}
        message={`Every other size is still there — this is the only one that came back empty${
          query.q ? ` for “${query.q}”` : ''
        }. Clear the size to see the rest, or try a neighbouring size.`}
        suggestions={suggestions}
        suggestionsLabel="Browse instead"
        actions={withWayOut({
          label: 'Clear the size filter',
          href: catalogueHref(basePath, query, { size: undefined })
        })}
      />
    );
  }

  if (query.q) {
    return (
      <GridEmptyState
        title={`No results for “${query.q}”`}
        message={`We could not match that to anything${inScope}. Try a shorter word or check the spelling${
          suggestions.length > 0 ? ', or open one of the collections below' : ''
        }.`}
        suggestions={suggestions}
        suggestionsLabel="Browse instead"
        actions={withWayOut({
          label: 'Clear the search',
          href: catalogueHref(basePath, query, { q: undefined })
        })}
      />
    );
  }

  if (scope.kind !== 'catalogue') {
    return (
      <GridEmptyState
        icon={<EmptyRailIcon />}
        title={`No ${scope.title} in stock`}
        message={`Nothing in this ${
          scope.kind === 'collection' ? 'collection' : 'category'
        } is available right now — this is not a broken page, the rail is simply empty. New ${scope.title.toLowerCase()} pieces are added regularly, so it is worth another look soon, and the rest of the catalogue is open in the meantime.`}
        suggestions={suggestions}
        suggestionsLabel="Other collections"
        /* The collection case is the one place on this page where the primary
           action is a genuine destination rather than an undo, so it takes the
           view's single filled-gold element. */
        actions={withWayOut({ label: 'View all products', href: '/search' })}
      />
    );
  }

  return (
    <GridEmptyState
      title="No products yet"
      message="The catalogue is empty at the moment. New pieces are added regularly, so please check back soon."
      suggestions={suggestions}
      suggestionsLabel="Browse instead"
      actions={[{ label: 'Back to home', href: '/' }]}
    />
  );
}
