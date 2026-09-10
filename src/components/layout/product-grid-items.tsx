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
 * Entrance animations stagger, but only for the first few cards. An uncapped
 * `index * step` meant the last card of a long page faded in tens of seconds
 * after load, which reads as a broken page.
 */
const MAX_STAGGER_STEPS = 7;
const STAGGER_STEP_SECONDS = 0.06;

interface ProductGridItemsProps {
  products: Product[];
  /** Extra delay in seconds applied before the stagger, for below-the-fold sections. */
  delay?: number;
  /** Animation duration in seconds, forwarded to each card. */
  duration?: number;
}

export default function ProductGridItems({ products, delay = 0, duration }: ProductGridItemsProps) {
  return (
    <>
      {products.map((product, index) => (
        <Grid.Item key={product.id}>
          <ProductCard
            product={product}
            delay={delay + Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP_SECONDS}
            duration={duration}
          />
        </Grid.Item>
      ))}
    </>
  );
}
