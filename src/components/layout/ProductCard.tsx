'use client';

import { Product } from '@/lib/supabase/types';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Price from '../common/price';

interface ProductCardProps {
  product: Product;
  /** Entrance delay in seconds. Callers cap their own stagger. */
  delay?: number;
  /** Entrance duration in seconds. `0` opts a card out of the reveal. */
  duration?: number;
}

/**
 * The plate.
 *
 * Not a card: no wrapper background, no radius, no border, no resting shadow.
 * A 3:4 photograph on a warm `paper-sunk` mat, the page ground doing the
 * framing, and the price as the only metallic element — which is what makes it
 * the focal point and is commercially correct.
 *
 * Gold here is `zari-700` (#8A6410, 4.85:1 on paper), never `zari-500`
 * (1.96:1). The plate lives on paper in all three of its densities: the
 * catalogue grid, the Best Sellers carousel and New Arrivals.
 */

/** 2-up on phones, ~3-up on tablets, ~290px in the 4-column desktop grid. */
const PRODUCT_CARD_SIZES = '(max-width: 640px) 45vw, (max-width: 1024px) 31vw, 290px';

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

/** The cloth reveal: 520ms, `ease-cloth`, a wipe up rather than a fade. */
const CLOTH_REVEAL_SECONDS = 0.52;
const EASE_CLOTH = [0.22, 0.61, 0.36, 1] as const;

function usableImage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'undefined' && trimmed !== 'null' ? trimmed : null;
}

export default function ProductCard({ product, delay = 0, duration }: ProductCardProps) {
  // framer-motion animates in JS, so the global reduced-motion block in
  // globals.css cannot reach it. This is the gate the spec asks for: with the
  // preference set the plate is simply present, un-clipped, from the start.
  const prefersReducedMotion = useReducedMotion();

  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = usableImage(images[0]) ?? PLACEHOLDER_IMAGE;
  const secondaryImage = usableImage(images[1]);
  const sizes = Array.isArray(product.sizes)
    ? product.sizes.filter((size): size is string => typeof size === 'string' && !!size.trim())
    : [];

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0 0)' }}
      transition={{
        duration: duration ?? CLOTH_REVEAL_SECONDS,
        delay,
        ease: EASE_CLOTH
      }}
      className="group w-full"
    >
      <Link href={`/product/${product.handle}`} className="block">
        {/*
          The mat. Hover and focus-visible get the identical treatment, so the
          keyboard gets everything the mouse does: the mat lifts from
          `paper-sunk` to `paper-raised` and `shadow-card` fades in. The
          photograph itself never scales.
        */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-plate bg-paper-sunk transition-colors duration-fast ease-cloth group-focus-within:bg-paper-raised group-focus-within:shadow-card group-hover:bg-paper-raised group-hover:shadow-card">
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            sizes={PRODUCT_CARD_SIZES}
            className="object-cover object-center"
          />

          {/* The second shot cross-fades over the first where one exists. */}
          {secondaryImage ? (
            <Image
              src={secondaryImage}
              alt=""
              aria-hidden="true"
              fill
              sizes={PRODUCT_CARD_SIZES}
              className="object-cover object-center opacity-0 transition-opacity duration-fast ease-cloth group-focus-within:opacity-100 group-hover:opacity-100"
            />
          ) : null}
        </div>

        <div className="pt-4">
          {product.category ? <p className="eyebrow text-ink-muted">{product.category}</p> : null}

          {/*
            The zari thread draws left-to-right under the title on card hover
            AND card focus. `.thread-link` only reacts to its own :hover, so
            the plate builds the same 1px bar with `group-*:after:` variants.
          */}
          <h3 className="relative mt-2 inline-block max-w-full text-body font-medium text-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-zari-700 after:transition-transform after:duration-fast after:ease-cloth after:content-[''] group-focus-within:after:scale-x-100 group-hover:after:scale-x-100">
            <span className="line-clamp-2">{product.title}</span>
          </h3>

          <Price
            amount={product.price.toString()}
            currencyCode="INR"
            className="num mt-2 text-price text-zari-700"
          />

          {/*
            Merchandising in the space the hover state was already occupying.
            The row is laid out at every width from `md:` up and only its
            opacity changes, so revealing it never shifts the grid.
          */}
          {sizes.length > 0 ? (
            <p className="mt-2 hidden text-caption text-ink-muted opacity-0 transition-opacity duration-fast ease-cloth group-focus-within:opacity-100 group-hover:opacity-100 md:block">
              {sizes.join(' · ')}
            </p>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
