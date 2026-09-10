import Grid from '@/components/grid';

/**
 * Half a default page of plates. The skeleton occupies the space the results
 * will, without paying to paint a full 24-item page that is usually replaced
 * before the shopper reads it.
 */
const SKELETON_COUNT = 12;

export default function Loading() {
  return (
    <section aria-busy="true" className="container-page section flex flex-col items-center gap-12">
      <p className="sr-only" role="status">
        Loading products
      </p>

      {/* Mirrors the real header block: eyebrow, rule, heading, count, search. */}
      <div className="flex w-full max-w-3xl flex-col items-center gap-4">
        <div className="h-9 w-64 max-w-full animate-pulse rounded-control bg-line" />
        <div className="h-5 w-80 max-w-full animate-pulse rounded-control bg-paper-sunk" />
        <div className="h-12 w-full max-w-lg animate-pulse rounded-control bg-paper-sunk" />
      </div>

      <Grid>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <Grid.Item key={index} aria-hidden="true">
            {/* Mirrors the product plate: a 3:4 photo on the paper-sunk mat,
                then a two-line text block. No wrapper fill, no radius, no
                shadow — the plate has none of those at rest either. */}
            <div className="flex w-full flex-col gap-4">
              <div className="aspect-[3/4] w-full animate-pulse rounded-plate bg-paper-sunk" />
              <div className="flex flex-col gap-3">
                <div className="h-4 w-4/5 animate-pulse rounded-control bg-line" />
                <div className="h-5 w-1/3 animate-pulse rounded-control bg-line" />
              </div>
            </div>
          </Grid.Item>
        ))}
      </Grid>
    </section>
  );
}
