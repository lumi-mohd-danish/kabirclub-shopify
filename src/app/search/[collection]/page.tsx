import Grid, {
  GridEmptyState,
  GridPagination,
  buildPageHref,
  type SearchParamsRecord
} from '@/components/grid';
import ProductGridItems from '@/components/layout/product-grid-items';
import FilterList from '@/components/layout/search/filter';
import {
  DEFAULT_PRODUCTS_PAGE_SIZE,
  getCollection,
  getCollections,
  getProducts
} from '@/lib/supabase/api';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';

export const runtime = 'edge';

/**
 * `generateMetadata` and the page body both need the collection. `cache` makes
 * that a single lookup per request instead of two round trips.
 */
const loadCollection = cache((handle: string) => getCollection(handle));

const SORT_OPTIONS = [
  { title: 'Price: Low to High', slug: 'price-asc' },
  { title: 'Price: High to Low', slug: 'price-desc' },
  { title: 'Latest', slug: 'created_at-desc' },
  { title: 'Oldest', slug: 'created_at-asc' }
];

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();

  return trimmed ? trimmed : undefined;
}

function parseSort(sort: string | undefined): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const [field, order] = (sort ?? '').split('-');

  return {
    sortBy: field === 'price' || field === 'title' ? field : 'created_at',
    sortOrder: order === 'asc' ? 'asc' : 'desc'
  };
}

function parsePage(page: string | undefined): number {
  const parsed = Number.parseInt(page ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params
}: {
  params: { collection: string };
}): Promise<Metadata> {
  const collection = await loadCollection(params.collection);

  if (!collection) return notFound();

  return {
    title: collection.title,
    description: collection.description || `${collection.title} products`
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { collection: string };
  searchParams?: SearchParamsRecord;
}) {
  const collection = await loadCollection(params.collection);

  if (!collection) return notFound();

  const query = searchParams ?? {};
  const { sortBy, sortOrder } = parseSort(firstParam(query.sort));
  const requestedPage = parsePage(firstParam(query.page));
  const basePath = `/search/${collection.handle}`;

  // `getProducts` matches `products.category` case-insensitively, so the
  // lowercase collection handle finds the capitalised category rows — and it
  // reports the true row count, which paging needs.
  const { products, total, limit, offset } = await getProducts({
    category: collection.handle,
    sortBy,
    sortOrder,
    page: requestedPage - 1,
    limit: DEFAULT_PRODUCTS_PAGE_SIZE
  });

  const pageSize = limit || DEFAULT_PRODUCTS_PAGE_SIZE;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  // A stale `page` (bookmarked, or kept when the sort changed) must not read as
  // an empty collection.
  if (total > 0 && products.length === 0 && requestedPage > lastPage) {
    redirect(buildPageHref(basePath, query, lastPage));
  }

  const rangeStart = offset + 1;
  const rangeEnd = offset + products.length;
  const itemsLabel = total === 1 ? 'product' : 'products';

  // Only needed to populate the empty state.
  const otherCollections =
    products.length === 0
      ? (await getCollections()).filter((entry) => entry.handle !== collection.handle)
      : [];

  return (
    <section className="mx-auto flex w-full max-w-[904px] flex-col items-center gap-[48px] px-4 py-[48px]">
      <div className="flex w-full max-w-[800px] flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-lora text-3xl font-bold capitalize text-white">{collection.title}</h1>
          {collection.description && (
            <p className="max-w-xl text-base text-gray-400">{collection.description}</p>
          )}
          {products.length > 0 && (
            <p className="text-lg text-gray-300">
              Showing {rangeStart}&ndash;{rangeEnd} of {total} {itemsLabel}
            </p>
          )}
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
            basePath={basePath}
            searchParams={query}
            total={total}
            limit={pageSize}
            offset={offset}
            itemLabel={itemsLabel}
          />
        </>
      ) : (
        <GridEmptyState
          icon={<EmptyRailIcon />}
          title={`No ${collection.title} in stock`}
          message={`This collection is empty right now. New ${collection.title.toLowerCase()} pieces are added regularly, so it is worth another look soon.`}
          suggestions={otherCollections.map((entry) => ({
            title: entry.title,
            href: `/search/${entry.handle}`
          }))}
          suggestionsLabel="Other collections"
          actions={[
            { label: 'View all products', href: '/search' },
            { label: 'Back to home', href: '/', variant: 'secondary' }
          ]}
        />
      )}
    </section>
  );
}

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
