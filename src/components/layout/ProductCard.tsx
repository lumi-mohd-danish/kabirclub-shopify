'use client';

import ImageWithFallback from '@/components/common/ImageWithFallback';
import Price from '@/components/common/price';
import { Product } from '@/lib/supabase/types';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

/**
 * The plate. The ONLY product card in the app.
 *
 * Three of these used to ship — this one, `product/ProductCard.tsx`, and a copy
 * inlined in `product-grid-items.tsx` — and two of them rendered in adjacent
 * sections of the same homepage, at different aspect ratios, with different
 * `sizes` hints and two different price formatters. The catalogue grid, the
 * Best Sellers carousel, New Arrivals and the PDP recommendations now all
 * render this file.
 *
 * Not a card: no wrapper background, no radius, no border, no resting shadow.
 * A 3:4 photograph on a warm `paper-sunk` mat, the page ground doing the
 * framing, and the price as the only metallic element — which is what makes it
 * the focal point and is commercially correct.
 *
 * Gold here is `zari-700` (#8A6410, 4.85:1 on paper), never `zari-500`
 * (1.96:1). The mat is `paper-sunk` and carries no text, which is exactly why
 * zari-700's 4.42:1 on that surface never comes up.
 */

/**
 * The catalogue default: 2-up on phones, 3-up on tablets, 4-up in the desktop
 * grid (1240px container, lg gutters, `gap-x-6` → ~272px a column) and ~280px
 * in the Best Sellers carousel.
 *
 * Sections whose columns are wider than that pass their own — an under-stated
 * `sizes` is how a sharp photograph ends up served at half the resolution it
 * is painted at.
 */
export const PRODUCT_CARD_SIZES = '(max-width: 640px) 48vw, (max-width: 1024px) 36vw, 300px';

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

/** The cloth reveal: 520ms, `ease-cloth`, a wipe up rather than a fade. */
const CLOTH_REVEAL_SECONDS = 0.52;
const EASE_CLOTH = [0.22, 0.61, 0.36, 1] as const;

/**
 * Sample rows, half-migrated Supabase rows and hand-entered admin rows all
 * reach this component, and between them they have produced every one of
 * these: the literal strings `"undefined"` and `"null"` (a template literal
 * that interpolated a missing value), an `example.com` seed URL that is not in
 * `next.config.js`'s `remotePatterns` and therefore throws inside next/image,
 * and plain whitespace.
 */
function usableImage(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return null;
  if (trimmed.includes('example.com')) return null;

  return trimmed;
}

interface ProductCardProps {
  product: Product;
  /** Entrance delay in seconds. Callers cap their own stagger at `Math.min(i, 6) * 0.04`. */
  delay?: number;
  /** Entrance duration in seconds. `0` opts a card out of the reveal. */
  duration?: number;
  /** Layout hint for next/image. Override when the column is wider than the catalogue's. */
  sizes?: string;
  /** Set on the first row of an above-the-fold grid so the LCP image is not lazy. */
  priority?: boolean;
}

export default function ProductCard({
  product,
  delay = 0,
  duration,
  sizes = PRODUCT_CARD_SIZES,
  priority = false
}: ProductCardProps) {
  // framer-motion animates in JS, so the global reduced-motion block in
  // globals.css cannot reach it. This is the gate the spec asks for: with the
  // preference set the plate is simply present, un-clipped, from the start.
  const prefersReducedMotion = useReducedMotion();

  // Everything below is defensive for the same reason `usableImage` is: this
  // component is handed rows from Supabase, from the sample-data fallback and
  // from the admin forms, and a missing handle used to route to `/product/`.
  const title =
    typeof product.title === 'string' && product.title.trim() ? product.title : 'Product';
  const handle =
    typeof product.handle === 'string' && product.handle.trim() ? product.handle.trim() : null;
  const price =
    typeof product.price === 'number' && Number.isFinite(product.price) ? product.price : 0;

  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = usableImage(images[0]) ?? PLACEHOLDER_IMAGE;
  const secondaryImage = usableImage(images[1]);
  const productSizes = Array.isArray(product.sizes)
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
      <Link href={handle ? `/product/${handle}` : '/search'} className="block">
        {/*
          The mat. Hover and focus-visible get the identical treatment, so the
          keyboard gets everything the mouse does: the mat lifts from
          `paper-sunk` to `paper-raised` and `shadow-card` fades in. The
          photograph itself never scales.
        */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-plate bg-paper-sunk transition-colors duration-fast ease-cloth group-focus-within:bg-paper-raised group-focus-within:shadow-card group-hover:bg-paper-raised group-hover:shadow-card">
          {/*
            A URL can pass `usableImage` and still 404, so the primary shot goes
            through the shared fallback wrapper rather than leaving a hole in
            the grid. `key` is the resolved src: the wrapper seeds its state
            once, so without this a recycled card would keep showing the
            previous product's fallback.

            `unoptimized` is limited to the bundled placeholder — a static
            900x1200 plate the optimizer can only make bigger. Real photography
            goes through the optimizer, which is the point of using next/image.
          */}
          <ImageWithFallback
            key={primaryImage}
            src={primaryImage}
            fallbackSrc={PLACEHOLDER_IMAGE}
            alt={title}
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={primaryImage === PLACEHOLDER_IMAGE}
            className="object-cover object-center"
          />

          {/*
            The second shot cross-fades over the first where one exists. No
            fallback on this layer on purpose: if it 404s the hover simply does
            not happen, which is better than hovering a real garment and being
            handed a placeholder.
          */}
          {secondaryImage ? (
            <Image
              src={secondaryImage}
              alt=""
              aria-hidden="true"
              fill
              sizes={sizes}
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
            <span className="line-clamp-2">{title}</span>
          </h3>

          {/* `.num` and the en-IN formatting live in <Price>; the plate only
              owns the colour and the size, because it is the one that knows it
              is sitting on paper. */}
          <Price amount={price} currencyCode="INR" className="mt-2 text-price text-zari-700" />

          {/*
            Merchandising in the space the hover state was already occupying.
            The row is laid out at every width from `md:` up and only its
            opacity changes, so revealing it never shifts the grid.
          */}
          {productSizes.length > 0 ? (
            <p className="mt-2 hidden text-caption text-ink-muted opacity-0 transition-opacity duration-fast ease-cloth group-focus-within:opacity-100 group-hover:opacity-100 md:block">
              {productSizes.join(' · ')}
            </p>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
