import Grid, {
  GridEmptyState,
  GridPagination,
  buildPageHref,
  type SearchParamsRecord
} from '@/components/grid';
import ProductGridItems from '@/components/layout/product-grid-items';
import FilterList from '@/components/layout/search/filter';
import SearchInput from '@/components/layout/search/SearchInput';
import { DEFAULT_PRODUCTS_PAGE_SIZE, getCollections, getProducts } from '@/lib/supabase/api';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Search',
  description: 'Search for products in the store.'
};

const SORT_OPTIONS = [
  { title: 'Price: Low to High', slug: 'price-asc' },
  { title: 'Price: High to Low', slug: 'price-desc' },
  { title: 'Latest', slug: 'created_at-desc' },
  { title: 'Oldest', slug: 'created_at-asc' }
];

/** Query strings can repeat a key (`?q=a&q=b`); take the first usable value. */
function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();

  return trimmed ? trimmed : undefined;
}

/** `?sort=price-asc` → `{ sortBy: 'price', sortOrder: 'asc' }`. Anything unknown falls back. */
function parseSort(sort: string | undefined): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const [field, order] = (sort ?? '').split('-');

  return {
    sortBy: field === 'price' || field === 'title' ? field : 'created_at',
    sortOrder: order === 'asc' ? 'asc' : 'desc'
  };
}

/** 1-based page number from the URL; anything invalid is page 1. */
function parsePage(page: string | undefined): number {
  const parsed = Number.parseInt(page ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function SearchPage({ searchParams }: { searchParams?: SearchParamsRecord }) {
  const params = searchParams ?? {};
  const searchValue = firstParam(params.q);
  const category = firstParam(params.category);
  const { sortBy, sortOrder } = parseSort(firstParam(params.sort));
  const requestedPage = parsePage(firstParam(params.page));

  const { products, total, limit, offset } = await getProducts({
    query: searchValue,
    category,
    sortBy,
    sortOrder,
    page: requestedPage - 1,
    limit: DEFAULT_PRODUCTS_PAGE_SIZE
  });

  const pageSize = limit || DEFAULT_PRODUCTS_PAGE_SIZE;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  // A stale `page` (bookmarked, or carried over when the shopper changed the
  // query or the sort) must not read as "there are no products". Send them to
  // the last page that actually has rows.
  if (total > 0 && products.length === 0 && requestedPage > lastPage) {
    redirect(buildPageHref('/search', params, lastPage));
  }

  const categoryLabel = category?.replace(/-/g, ' ');
  const heading = searchValue ? 'Search Results' : (categoryLabel ?? 'All Products');
  const rangeStart = offset + 1;
  const rangeEnd = offset + products.length;
  const resultsLabel = total === 1 ? 'result' : 'results';

  // Only needed to populate the empty state, so it is not fetched on the happy path.
  const collections = products.length === 0 ? await getCollections() : [];
  const suggestions = collections.map((collection) => ({
    title: collection.title,
    href: `/search/${collection.handle}`
  }));

  return (
    <section className="mx-auto flex w-full max-w-[904px] flex-col items-center gap-[48px] px-4 py-[48px]">
      <div className="flex w-full max-w-[800px] flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h1 className="font-lora text-3xl font-bold capitalize text-[#daa520]">{heading}</h1>
            {products.length > 0 && (
              <p className="mt-2 text-lg text-gray-300">
                Showing {rangeStart}&ndash;{rangeEnd} of {total} {resultsLabel}
                {searchValue ? (
                  <>
                    {' for '}
                    <span className="font-bold text-[#daa520]">&quot;{searchValue}&quot;</span>
                  </>
                ) : null}
              </p>
            )}
          </div>

          <div className="w-full max-w-[500px]">
            <SearchInput />
          </div>
        </div>

        {products.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-4">
            <span className="text-lg font-medium text-gray-300">Sort by:</span>
            <FilterList list={SORT_OPTIONS} />
          </div>
        )}
      </div>

      {products.length > 0 ? (
        <>
          <Grid>
            <ProductGridItems products={products} />
          </Grid>

          <GridPagination
            basePath="/search"
            searchParams={params}
            total={total}
            limit={pageSize}
            offset={offset}
            itemLabel={total === 1 ? 'product' : 'products'}
          />
        </>
      ) : (
        <GridEmptyState
          title={
            searchValue
              ? `No results for “${searchValue}”`
              : categoryLabel
                ? `Nothing in ${categoryLabel} yet`
                : 'No products yet'
          }
          message={
            searchValue
              ? 'We could not match that search to anything in the store. Try a shorter word, check the spelling, or pick a collection below.'
              : categoryLabel
                ? 'This category has no products in stock right now. New pieces are added regularly, so it is worth another look soon.'
                : 'The catalogue is empty at the moment. New pieces are added regularly, so please check back soon.'
          }
          suggestions={suggestions}
          actions={
            searchValue || category
              ? [
                  { label: 'View all products', href: '/search' },
                  { label: 'Back to home', href: '/', variant: 'secondary' }
                ]
              : [{ label: 'Back to home', href: '/' }]
          }
        />
      )}
    </section>
  );
}
