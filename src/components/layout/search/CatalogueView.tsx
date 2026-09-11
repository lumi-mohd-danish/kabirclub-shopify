import { redirect } from 'next/navigation';
import { cache } from 'react';

import SectionHeading from '@/components/common/SectionHeading';
import Grid, { GridPagination, buildPageHref, type EmptyStateLink } from '@/components/grid';
import ProductGridItems from '@/components/layout/product-grid-items';
import { getCollections } from '@/lib/supabase/api';

import CatalogueEmptyState, { type CatalogueScope } from './CatalogueEmptyState';
import CatalogueToolbar from './CatalogueToolbar';
import FacetRail, { hasCategoryFacets, hasSizeFacets } from './FacetRail';
import SearchInput from './SearchInput';
import { loadCatalogue } from './data';
import { catalogueSearchParams, type CatalogueQuery } from './options';

/**
 * THE catalogue view.
 *
 * `/search` and `/search/[collection]` are the same screen with a different
 * source for the category, and until this component they were two 180-line
 * files that each re-derived the header, the sort row, the empty state and the
 * pagination — which is how the two pages ended up with different empty-state
 * copy, one showing a search field and the other not, and a heading assembled
 * by hand on both instead of through `SectionHeading`.
 *
 * Everything below the route-specific title now happens exactly once, here.
 * The pages are left with what genuinely differs: where the category comes
 * from, and what the heading says.
 */

/** Collections are only ever needed to populate an empty state's suggestions. */
const loadCollections = cache(getCollections);

export interface CatalogueViewProps {
  /** `/search`, or `/search/<handle>` on a collection route. */
  basePath: string;
  /** Parsed once by the page — it needs the same values for its heading. */
  query: CatalogueQuery;
  /** Eyebrow for the shared `SectionHeading`. Never blank: it names the register. */
  eyebrow: string;
  title: string;
  /** The collection's own copy, where it has any. */
  description?: string;
  /** What the empty state calls this listing. */
  scope: CatalogueScope;
}

export default async function CatalogueView({
  basePath,
  query,
  eyebrow,
  title,
  description,
  scope
}: CatalogueViewProps) {
  const catalogue = await loadCatalogue(query);
  const { products, total, limit, offset, lastPage } = catalogue;

  // Every link on this page is rebuilt from the parsed query rather than from
  // the incoming URL, so pagination gets the same normalised record and cannot
  // drag an unknown parameter across a page boundary.
  const linkParams = catalogueSearchParams(query);

  // A stale `page` — bookmarked, or carried over when the shopper changed the
  // query, the facet or the sort — must not read as "there are no products".
  // Send them to the last page that actually has rows.
  if (total > 0 && products.length === 0 && query.page > lastPage) {
    redirect(buildPageHref(basePath, linkParams, lastPage));
  }

  const itemLabel = total === 1 ? 'product' : 'products';
  // The rail and this layout have to agree: a two-column frame around an aside
  // that renders nothing would leave the grid indented for no reason.
  const hasFacets =
    hasCategoryFacets(catalogue.categories) || hasSizeFacets(catalogue.sizes, query.size);

  // Fetched only for the empty state, so the happy path never pays for it.
  const suggestions: EmptyStateLink[] =
    products.length === 0
      ? (await loadCollections())
          .filter((collection) => collection.handle !== query.category?.toLowerCase())
          .map((collection) => ({ title: collection.title, href: `/search/${collection.handle}` }))
      : [];

  const emptyState = (
    <CatalogueEmptyState
      basePath={basePath}
      query={query}
      scope={scope}
      suggestions={suggestions}
      unfilteredTotal={catalogue.unfilteredTotal}
    />
  );

  return (
    <section className="container-page section flex flex-col gap-12">
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 self-center text-center">
        {/* The eyebrow / zari thread / heading composite, built in one place
            rather than by hand on each route — which is how one of the two
            listings previously lost its eyebrow and, with it, the thread. */}
        <SectionHeading eyebrow={eyebrow} title={title} as="h1" align="center" className="w-full" />

        {description && <p className="max-w-[62ch] text-lead text-ink-muted">{description}</p>}

        <div className="w-full max-w-lg">
          <SearchInput category={query.categoryLocked ? query.category : undefined} />
        </div>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        {/* No rail when there is nothing real to filter by — a catalogue with
            one category and no sizes recorded would otherwise get a column of
            controls that change nothing. */}
        {hasFacets && (
          <FacetRail
            basePath={basePath}
            query={query}
            categories={catalogue.categories}
            sizes={catalogue.sizes}
            /* Counts are printed only when the facet scan saw every matching
               row. Past that window they would be a sample, and a number that
               is nearly right is worse than no number. */
            showCounts={catalogue.countsAreExact}
          />
        )}

        {/* `min-w-0` so a long product title cannot push the grid wider than
            its column and start the page scrolling sideways. */}
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {products.length > 0 ? (
            <>
              <CatalogueToolbar
                basePath={basePath}
                query={query}
                total={total}
                rangeStart={offset + 1}
                rangeEnd={offset + products.length}
                itemLabel={itemLabel}
              />

              <Grid>
                <ProductGridItems products={products} />
              </Grid>

              <GridPagination
                basePath={basePath}
                searchParams={linkParams}
                total={total}
                limit={limit}
                offset={offset}
                itemLabel={itemLabel}
              />
            </>
          ) : (
            /* The empty state owns the whole column: it already names the cause
               and carries the labelled way back, so a toolbar above it would
               only offer the same undo a second time, in smaller type. */
            emptyState
          )}
        </div>
      </div>
    </section>
  );
}
