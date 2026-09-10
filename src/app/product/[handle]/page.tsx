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
      <section className="flex w-full flex-col items-center bg-black justify-center py-[24px] md:py-[48px]">
        <h2 className="sr-only">Product Information</h2>
        <article className="flex w-full max-w-[95%] flex-col items-stretch justify-center gap-4 md:w-[1000px] md:flex-row">
          <div className="max-w-[450px] md:w-1/2">
            <ProductSlider product={product} />
          </div>
          <div className="md:w-1/2">
            <ProductDescription product={product} />
          </div>
        </article>
        <Suspense>
          <RecommendedItems productId={product.id} />
        </Suspense>
      </section>
    </>
  );
};

export default ProductPage;
