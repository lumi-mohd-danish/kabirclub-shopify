import type { SearchParamsRecord } from '@/components/grid';
import CatalogueView from '@/components/layout/search/CatalogueView';
import type { CatalogueScope } from '@/components/layout/search/CatalogueEmptyState';
import { parseCatalogueQuery } from '@/components/layout/search/options';

export const metadata = {
  title: 'Search',
  description: 'Search for products in the store.'
};

/**
 * `?category=` carries a handle ('topwear', 'mens-shirts'); a heading is not a
 * URL. The rail's chips get the same treatment from CSS `capitalize`, so the
 * two read alike.
 */
function categoryHeading(category: string): string {
  return category.replace(/-/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

/**
 * The catalogue.
 *
 * Everything this page and `/search/[collection]` have in common — the header,
 * the facet rail, the sort control, the grid, the pagination and the empty
 * state — lives in `CatalogueView`. What is left here is the only thing that is
 * genuinely this route's: the category arrives as `?category=`, and the heading
 * changes depending on whether the shopper is searching, browsing a category,
 * or looking at the whole catalogue.
 */
export default function SearchPage({ searchParams }: { searchParams?: SearchParamsRecord }) {
  const query = parseCatalogueQuery(searchParams);
  const categoryLabel = query.category ? categoryHeading(query.category) : undefined;

  const scope: CatalogueScope = categoryLabel
    ? { kind: 'category', title: categoryLabel }
    : { kind: 'catalogue' };

  return (
    <CatalogueView
      basePath="/search"
      query={query}
      // The eyebrow names the register the page is in, so the heading itself
      // does not have to.
      eyebrow={query.q ? 'Search' : categoryLabel ? 'Collection' : 'Catalogue'}
      title={query.q ? 'Search Results' : (categoryLabel ?? 'All Products')}
      scope={scope}
    />
  );
}
