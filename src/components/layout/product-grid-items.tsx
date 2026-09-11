import Grid from '@/components/grid';
import ProductCard from '@/components/layout/ProductCard';
import { Product } from '@/lib/supabase/types';

/**
 * The `<li>` children of a `<Grid>`.
 *
 * This component deliberately renders NO grid of its own: the parent `<Grid>`
 * owns the columns, and the cards come from the shared `ProductCard` rather
 * than a private copy of it.
 *
 * It is a server component — the only client boundary is `ProductCard` itself,
 * so a 24-card page ships one card bundle instead of also shipping this mapper.
 */

/**
 * The cloth reveal staggers, but only for the first few plates. An uncapped
 * `index * step` meant the last card of a long page arrived tens of seconds
 * after load, which reads as a broken page.
 *
 * 40ms a step, capped at six steps: 240ms from the first plate to the last one
 * that is still staggered, which is roughly the length of the reveal itself.
 */
const MAX_STAGGER_STEPS = 6;
const STAGGER_STEP_SECONDS = 0.04;

/**
 * The listing grid IS the page content, so its first plates are the LCP
 * candidate. Two of them are eager; everything past that stays lazy, because
 * preloading a whole 24-card page would put the images in a queue behind each
 * other and make the first one arrive later, not sooner.
 */
const DEFAULT_PRIORITY_COUNT = 2;

interface ProductGridItemsProps {
  products: Product[];
  /** Extra delay in seconds applied before the stagger, for below-the-fold sections. */
  delay?: number;
  /** Animation duration in seconds, forwarded to each card. */
  duration?: number;
  /** How many leading images load eagerly. `0` for a grid that is below the fold. */
  priorityCount?: number;
}

export default function ProductGridItems({
  products,
  delay = 0,
  duration,
  priorityCount = DEFAULT_PRIORITY_COUNT
}: ProductGridItemsProps) {
  return (
    <>
      {products.map((product, index) => (
        <Grid.Item key={product.id}>
          <ProductCard
            product={product}
            delay={delay + Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP_SECONDS}
            duration={duration}
            priority={index < priorityCount}
          />
        </Grid.Item>
      ))}
    </>
  );
}
