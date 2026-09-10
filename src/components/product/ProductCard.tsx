'use client';

import { Product } from '@/lib/supabase/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Price from '../common/price';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

/**
 * The plate, in its static form.
 *
 * Same treatment as `src/components/layout/ProductCard.tsx` — a 3:4 photograph
 * on a `paper-sunk` mat, no radius, no border, no resting shadow, the price in
 * `zari-700` as the only metallic element — minus the framer-motion entrance,
 * because this copy is rendered inside sections that stagger their own
 * children. Consolidating the two is Phase 3; this pass only repaints them so
 * they read as the same object.
 */

/**
 * The card is rendered in a 2-column grid on phones, a ~2.5-up carousel on
 * tablets and a 3-column grid (max ~300px wide) on desktop. Telling next/image
 * this up front is what lets it emit a useful srcset instead of always serving
 * the largest candidate.
 */
const PRODUCT_CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 300px';

function resolveImageSrc(images: Product['images']): string {
  const first = Array.isArray(images) ? images[0] : undefined;

  if (typeof first !== 'string') {
    return PLACEHOLDER_IMAGE;
  }

  const trimmed = first.trim();

  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.includes('example.com')) {
    return PLACEHOLDER_IMAGE;
  }

  return trimmed;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Ensure product has required properties
  const safeProduct = {
    id: product.id || 'unknown',
    title: product.title || 'Product',
    description: product.description || 'No description available',
    price: typeof product.price === 'number' && Number.isFinite(product.price) ? product.price : 0,
    category: product.category || 'Uncategorized',
    handle: product.handle || 'product'
  };

  const resolvedSrc = resolveImageSrc(product.images);

  // Track the src that failed rather than mutating the <img> element: next/image
  // owns `src`/`srcset` on that node, so assigning to it in an onError handler is
  // overwritten on the next render. Keying off the resolved src also means the
  // fallback resets automatically when this card is reused for another product.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = failedSrc === resolvedSrc ? PLACEHOLDER_IMAGE : resolvedSrc;
  const isPlaceholder = imageSrc === PLACEHOLDER_IMAGE;

  return (
    <div className="group w-full">
      <Link href={`/product/${safeProduct.handle}`} className="block">
        {/* The mat lifts on hover and on focus alike; the photo never scales. */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-plate bg-paper-sunk transition-colors duration-fast ease-cloth group-hover:bg-paper-raised group-hover:shadow-card group-focus-within:bg-paper-raised group-focus-within:shadow-card">
          <Image
            src={imageSrc}
            alt={safeProduct.title}
            fill
            sizes={PRODUCT_CARD_SIZES}
            className="object-cover object-center"
            onError={() => setFailedSrc(resolvedSrc)}
            // The bundled placeholder is a small static asset already sized for
            // the card - running it through the optimizer buys nothing.
            unoptimized={isPlaceholder}
          />
        </div>

        <div className="pt-4">
          <p className="eyebrow text-ink-muted">{safeProduct.category}</p>

          {/* The zari thread draws under the title on card hover and focus. */}
          <h3 className="relative mt-2 inline-block max-w-full text-body font-medium text-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-zari-700 after:transition-transform after:duration-fast after:ease-cloth after:content-[''] group-hover:after:scale-x-100 group-focus-within:after:scale-x-100">
            <span className="line-clamp-2">{safeProduct.title}</span>
          </h3>

          <Price
            amount={safeProduct.price.toString()}
            currencyCode="INR"
            className="num mt-2 text-price text-zari-700"
          />
        </div>
      </Link>
    </div>
  );
}
