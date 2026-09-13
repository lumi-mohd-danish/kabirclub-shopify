// components
import ProductCard from '@/components/layout/ProductCard';
// supabase
import { getProductRecommendations } from '@/lib/supabase/api';
import type { Product } from '@/lib/supabase/types';

/**
 * The recommendations row shares the PDP's PAPER ground and the one content
 * inset (`.container-page`), so it lines up with the product row above it
 * instead of running to its own 904px width.
 *
 * The plates are the shared `ProductCard` — the same object the catalogue grid
 * and the homepage carousels render. This section used to import a second,
 * divergent copy of the card, which is how the PDP ended up with a different
 * hover, a different price format and a `sizes` hint that belonged to another
 * layout.
 */

/** 2-up to `lg`, 3-up above it: (1240 - 80 - 48) / 3 ≈ 370px a column. */
const RECOMMENDED_CARD_SIZES = '(max-width: 1024px) 48vw, 380px';

/** 40ms a plate, capped at the seventh — the reveal the whole app staggers with. */
const STAGGER_STEP_SECONDS = 0.04;
const MAX_STAGGER_STEPS = 6;

const RecommendedItems = async ({ productId }: { productId: string }) => {
  const products: Product[] = await getProductRecommendations(productId);

  if (!products.length) return null;

  return (
    <section className="container-page section">
      <div className="flex flex-col gap-4">
        <div className="rule-zari w-16" aria-hidden="true" />
        <h2 className="font-display text-h2 text-ink">Recommended Items</h2>
      </div>

      <div className="mt-10 grid w-full grid-cols-2 items-start gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14 lg:grid-cols-3">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            sizes={RECOMMENDED_CARD_SIZES}
            delay={Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP_SECONDS}
          />
        ))}
      </div>
    </section>
  );
};

export default RecommendedItems;
