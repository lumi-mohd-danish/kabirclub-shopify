// next
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// react
import { Suspense, cache } from 'react';

// supabase
import { getProduct } from '@/lib/supabase/api';

// components
import ProductDescription from '@/components/product/ProductDescription';
import ProductSlider from '@/components/product/ProductSlider';
import RecommendedItems from '@/components/product/RecommendedItems';

// site config
import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const runtime = 'edge';

/**
 * A catalogue page, not a dashboard: the same handle returns the same product
 * for every shopper, so it is served from the edge cache and re-fetched every
 * five minutes rather than hitting Supabase once per view. Admin edits land
 * within one revalidation window, which is the trade this page is happy with.
 */
export const revalidate = 300;

/**
 * `generateMetadata` and the page body both need the same product, and Next
 * calls them separately — which is two identical round trips per render.
 * `cache` collapses them into one lookup per request. Nothing else in the
 * route may call `getProduct` directly for the same reason.
 */
const loadProduct = cache((handle: string) => getProduct(handle));

export async function generateMetadata({
  params
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const product = await loadProduct(params.handle);

  if (!product) return notFound();

  const indexable = true; // Remove HIDDEN_PRODUCT_TAG check for now

  return {
    title: product.title,
    description: product.description,
    alternates: {
      canonical: `/product/${product.handle}`
    },
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
  const product = await loadProduct(params.handle);

  if (!product) return notFound();

  const category = product.category?.trim();
  const images = Array.isArray(product.images)
    ? product.images.filter((image): image is string => typeof image === 'string' && !!image.trim())
    : [];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    sku: product.id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    // An empty string is not a URL, and a product with no photograph is better
    // described as having no `image` than as having a blank one.
    ...(images.length ? { image: images } : {}),
    ...(category ? { category } : {}),
    // One price, one offer. The `AggregateOffer` this used to emit declared a
    // high and a low that were always the same number, which is a range of one.
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.handle}`,
      availability: 'https://schema.org/InStock',
      priceCurrency: 'INR',
      price: product.price.toString()
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
          fold, so this is not the taller `.section` rhythm.

          One inset for the whole route. `.container-page` here and
          `.container-page` on the recommendations strip below are the same
          1240px / 20-40px gutter, so the gallery's left edge, the buy panel's
          right edge and the recommendation plates all share two rules. There
          is no second width on this page and no local `max-w-*` anywhere in
          it — editorial prose still caps itself at `max-w-[62ch]` inside the
          panel, which is a measure, not a container. */}
      <div className="bg-paper text-ink">
        <div className="container-page py-6 md:py-10">
          {/* Where the shopper is, and the two ways back out — the catalogue as
              a whole, and the rail they were most likely browsing. A PDP
              reached from a search result or a shared link has no other route
              back into the catalogue. */}
          <nav aria-label="Breadcrumb" className="mb-6 md:mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-ink-muted">
              <li>
                <Link href="/" className="thread-link text-ink-muted">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/search" className="thread-link text-ink-muted">
                  Catalogue
                </Link>
              </li>
              {category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link
                      href={`/search?category=${encodeURIComponent(category)}`}
                      className="thread-link capitalize text-ink-muted"
                    >
                      {category}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">/</li>
              <li className="min-w-0">
                {/* The current page is never a link. It is also the only item
                    that may be long, so it truncates rather than pushing the
                    trail onto three lines on a phone. */}
                <span aria-current="page" className="block truncate text-ink">
                  {product.title}
                </span>
              </li>
            </ol>
          </nav>

          {/* 12-column split: the gallery takes 7, the buy panel 5 and sticks.
              `self-start` is what makes `sticky` work in a grid — a stretched
              item is already as tall as the row and has nothing to stick to. */}
          <article className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <ProductSlider product={product} />
            </div>
            <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
              {/* The product title is this page's only `h1`, and it lives in
                  the buy panel. The wrapper used to be a `<section>` carrying
                  an `sr-only` "Product Information" `h2`, which put an h2
                  ahead of the h1 and broke the heading order for anyone
                  navigating by headings; the recommendations strip below
                  brings its own `<section>` and its own h2. */}
              <ProductDescription product={product} />
            </div>
          </article>
        </div>

        <Suspense>
          <RecommendedItems productId={product.id} />
        </Suspense>
      </div>
    </>
  );
};

export default ProductPage;
