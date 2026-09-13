import type { SearchParamsRecord } from '@/components/grid';
import CatalogueView from '@/components/layout/search/CatalogueView';
import { parseCatalogueQuery } from '@/components/layout/search/options';
import { getCollection } from '@/lib/supabase/api';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

export const runtime = 'edge';

/**
 * `generateMetadata` and the page body both need the collection. `cache` makes
 * that a single lookup per request instead of two round trips.
 */
const loadCollection = cache((handle: string) => getCollection(handle));

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

/**
 * A collection.
 *
 * The same screen as `/search`, differing only in where the category comes
 * from: the path segment rather than `?category=`. `CatalogueView` renders the
 * rest — one header, one sort control, one empty state, one pagination — so the
 * two routes can no longer drift apart the way they had.
 *
 * `getProducts` matches `products.category` case-insensitively, so the
 * lowercase collection handle finds the capitalised category rows.
 */
export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { collection: string };
  searchParams?: SearchParamsRecord;
}) {
  const collection = await loadCollection(params.collection);

  if (!collection) return notFound();

  // The route owns the category here, which is what `categoryLocked` records:
  // links built for this page carry no `?category=` to contradict the path.
  const query = parseCatalogueQuery(searchParams, { category: collection.handle });

  return (
    <CatalogueView
      basePath={`/search/${collection.handle}`}
      query={query}
      eyebrow="Collection"
      title={collection.title}
      description={collection.description || undefined}
      scope={{ kind: 'collection', title: collection.title }}
    />
  );
}
