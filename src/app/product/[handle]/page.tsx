// next
import type { Metadata } from 'next';
// import Link from 'next/link';
import { notFound } from 'next/navigation';

// react
import { Suspense } from 'react';

// supabase
import { getProduct } from '@/lib/supabase/api';

// components
// import { ProductDescription } from '@/components/product/product-description';
import ProductDescription from '@/components/product/ProductDescription';
import ProductSlider from '@/components/product/ProductSlider';
import RecommendedItems from '@/components/product/RecommendedItems';

// types
// import { Image } from '@/lib/supabase/types';

export const runtime = 'edge';

export async function generateMetadata({
  params
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const indexable = true; // Remove HIDDEN_PRODUCT_TAG check for now

  return {
    title: product.title,
    description: product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable
      }
    }
  };
}

const ProductPage = async ({ params }: { params: { handle: string } }) => {
  const product = await getProduct(params.handle);

  if (!product) return notFound();

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images?.[0] || '',
    offers: {
      '@type': 'AggregateOffer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'INR',
      highPrice: product.price.toString(),
      lowPrice: product.price.toString()
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // Escape `<` so a title or description containing `</script>`
          // cannot break out of the script element.
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c')
        }}
      />
      {/* The PDP is a PAPER ground, like the catalogue it came from. Vertical
          padding stays tight on purpose: the photograph has to dominate the
          fold, so this is not the taller `.section` rhythm. */}
      <section className="bg-paper text-ink">
        <h2 className="sr-only">Product Information</h2>
        <div className="container-page py-6 md:py-12">
          {/* 12-column split: the gallery takes 7, the buy panel 5 and sticks.
              `self-start` is what makes `sticky` work in a grid — a stretched
              item is already as tall as the row and has nothing to stick to. */}
          <article className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <ProductSlider product={product} />
            </div>
            <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
              <ProductDescription product={product} />
            </div>
          </article>
        </div>
        <Suspense>
          <RecommendedItems productId={product.id} />
        </Suspense>
      </section>
    </>
  );
};

export default ProductPage;
