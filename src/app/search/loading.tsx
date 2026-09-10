import Grid from '@/components/grid';

/** One full default page of cards, so the skeleton occupies the space the results will. */
const SKELETON_COUNT = 12;

export default function Loading() {
  return (
    <section
      aria-busy="true"
      className="mx-auto flex w-full max-w-[904px] flex-col items-center gap-[48px] px-4 py-[48px]"
    >
      <p className="sr-only" role="status">
        Loading products
      </p>

      <div className="flex w-full max-w-[800px] flex-col items-center gap-4">
        <div className="h-9 w-64 max-w-full animate-pulse rounded-md bg-white/10" />
        <div className="h-5 w-80 max-w-full animate-pulse rounded-md bg-white/5" />
        <div className="h-[50px] w-full max-w-[500px] animate-pulse rounded-full bg-white/5" />
      </div>

      <Grid>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <Grid.Item key={index} aria-hidden="true">
            {/* Mirrors ProductCard: square image, then a two-line text block. */}
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg bg-white/[0.03]">
              <div className="aspect-square w-full animate-pulse bg-white/10" />
              <div className="flex flex-col gap-3 p-3 sm:p-4">
                <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          </Grid.Item>
        ))}
      </Grid>
    </section>
  );
}
