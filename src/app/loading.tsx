import Grid from '@/components/grid';

/**
 * The route-level fallback for every segment that does not ship its own
 * (`/search` has one). It used to return the bare string "Loading...", which
 * inherited the body colour and, before Phase 0, painted white on white.
 *
 * It draws the shape the page is about to occupy — a centred heading block
 * over a grid of plates — rather than a spinner, so the layout does not jump
 * when the real content lands. Eight plates is four rows at the mobile 2-up
 * and just over two at the md 3-up: enough to fill the fold without paying to
 * paint a page that is usually replaced before it is read.
 */
const SKELETON_COUNT = 8;

export default function Loading() {
  return (
    <section aria-busy="true" className="container-page section flex flex-col items-center gap-12">
      <p className="sr-only" role="status">
        Loading
      </p>

      {/* The identity device is real, not a skeleton bar: the woven zari rule
          is one line of CSS and it means the page reads as KabirClub from the
          first frame instead of as three grey boxes. */}
      <div className="flex w-full max-w-3xl flex-col items-center gap-4" aria-hidden="true">
        <div className="h-3 w-24 animate-pulse rounded-control bg-paper-sunk" />
        <div className="rule-zari w-16" />
        <div className="h-9 w-64 max-w-full animate-pulse rounded-control bg-line" />
      </div>

      <Grid aria-hidden="true">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <Grid.Item key={index}>
            {/* Mirrors the product plate exactly: a 3:4 photo on the
                paper-sunk mat, then the meta block. No wrapper fill, no
                radius, no shadow — the real plate has none of those at rest
                either, so the skeleton must not invent them. */}
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
