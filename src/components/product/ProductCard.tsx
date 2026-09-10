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
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
      <Link href={`/product/${safeProduct.handle}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageSrc}
            alt={safeProduct.title}
            fill
            sizes={PRODUCT_CARD_SIZES}
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            onError={() => setFailedSrc(resolvedSrc)}
            // The bundled placeholder is a small static asset already sized for
            // the card - running it through the optimizer buys nothing.
            unoptimized={isPlaceholder}
          />
        </div>

        <div className="p-4">
          <h3 className="mb-2 line-clamp-1 text-base font-semibold text-gray-800 sm:text-lg">
            {safeProduct.title}
          </h3>
          <div className="mb-3 flex items-center justify-between">
            <Price
              amount={safeProduct.price.toString()}
              currencyCode="INR"
              currencyCodeClassName="hidden"
              className="text-lg font-bold text-[#daa520] sm:text-xl"
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
