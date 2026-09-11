import Grid from '@/components/grid';

/**
 * Half a default page of plates. The skeleton occupies the space the results
 * will, without paying to paint a full 24-item page that is usually replaced
 * before the shopper reads it.
 */
const SKELETON_COUNT = 12;

/** Category group, then size group — the two rails `FacetRail` actually draws. */
const FACET_GROUPS = [4, 5];

export default function Loading() {
  return (
    <section aria-busy="true" className="container-page section flex flex-col gap-12">
      <p className="sr-only" role="status">
        Loading products
      </p>

      {/* Mirrors the real header block: eyebrow, thread, heading, search. */}
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 self-center">
        <div className="flex w-full flex-col items-center gap-3">
          <div className="h-3 w-24 animate-pulse rounded-control bg-line" />
          <div className="rule-zari w-16" aria-hidden="true" />
          <div className="h-9 w-64 max-w-full animate-pulse rounded-control bg-line" />
        </div>
        <div className="h-12 w-full max-w-lg animate-pulse rounded-control bg-paper-sunk" />
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        {/* The facet rail: a heading and two groups of chips, at chip height. */}
        <div className="w-full lg:w-56 lg:shrink-0">
          <div className="h-3 w-16 animate-pulse rounded-control bg-line" />
          <div className="rule-zari mt-3 w-16" aria-hidden="true" />
          <div className="mt-6 flex flex-col gap-7">
            {FACET_GROUPS.map((chipCount, groupIndex) => (
              <div key={groupIndex} className="flex flex-col gap-3">
                <div className="h-3 w-20 animate-pulse rounded-control bg-line" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: chipCount }).map((_, chipIndex) => (
                    <div
                      key={chipIndex}
                      className="h-8 w-20 animate-pulse rounded-control bg-paper-sunk"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          {/* The toolbar: result count on the left, sort control on the right. */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="h-4 w-44 animate-pulse rounded-control bg-line" />
            <div className="h-11 w-48 animate-pulse rounded-control bg-paper-sunk" />
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
        </div>
      </div>
    </section>
  );
}
