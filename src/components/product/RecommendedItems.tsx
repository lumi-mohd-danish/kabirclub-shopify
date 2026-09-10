// supabase
import { getProductRecommendations } from '@/lib/supabase/api';

// components
import ProductCard from '@/components/product/ProductCard';

/**
 * The recommendations row shares the PDP's PAPER ground and the one content
 * inset (`.container-page`), so it lines up with the product row above it
 * instead of running to its own 904px width.
 *
 * The `xs:` gutter it used to carry is gone with the `xs` breakpoint itself;
 * gutters now follow the catalogue's asymmetric pair — tight horizontal,
 * generous vertical.
 */
const RecommendedItems = async ({ productId }: { productId: string }) => {
  const products = await getProductRecommendations(productId);

  if (!products.length) return null;

  return (
    <section className="container-page section">
      <div className="flex flex-col gap-4">
        <div className="rule-zari w-16" aria-hidden="true" />
        <h2 className="font-display text-h2 text-ink">Recommended Items</h2>
      </div>

      <div className="mt-10 grid w-full grid-cols-2 items-start gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14 lg:grid-cols-3">
        {products.map((product: any, i: any) => (
          <ProductCard key={i} product={product} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedItems;
