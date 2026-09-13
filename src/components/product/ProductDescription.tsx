'use client';

import SectionHeading from '@/components/common/SectionHeading';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/lib/supabase/types';
import { shareOnWhatsApp } from '@/lib/whatsapp-share';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { addItem } from '../cart/actions';
import Price from '../common/price';

interface ProductDescriptionProps {
  product: Product;
}

type FeedbackTone = 'success' | 'error';

interface Feedback {
  tone: FeedbackTone;
  message: string;
}

/**
 * The cart action returns developer-facing strings (`"Failed to add item to
 * cart - no result returned"`, raw Postgres messages). None of those belong on
 * a product page, so every failure collapses to this one shopper-readable line.
 */
const ADD_TO_CART_ERROR = "Sorry, we couldn't add this item to your cart. Please try again.";
const SIZE_REQUIRED_ERROR = 'Please choose a size before adding this item to your cart.';
const ADD_TO_CART_SUCCESS = 'Added to your cart.';

/**
 * The eyebrow above the product title is the garment's category. Products can
 * arrive without one, and `SectionHeading` treats the eyebrow as required —
 * correctly, because a heading with no thread above it is the defect that
 * component exists to prevent — so this is what stands in.
 */
const FALLBACK_EYEBROW = 'Menswear';

const SUCCESS_DURATION_MS = 3000;
const ERROR_DURATION_MS = 6000;

/** Products come from the database, so `sizes` can arrive null, padded or duplicated. */
function normaliseSizes(sizes: Product['sizes']): string[] {
  if (!Array.isArray(sizes)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of sizes) {
    if (typeof value !== 'string') continue;
    const size = value.trim();
    if (!size || seen.has(size)) continue;
    seen.add(size);
    result.push(size);
  }

  return result;
}

export default function ProductDescription({ product }: ProductDescriptionProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const groupId = useId();
  const sizeGroupName = `product-size-${groupId}`;
  const sizeHintId = `product-size-hint-${groupId}`;
  const quantityLabelId = `product-quantity-label-${groupId}`;

  const isMountedRef = useRef(true);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, []);

  const sizes = useMemo(() => normaliseSizes(product.sizes), [product.sizes]);
  const requiresSize = sizes.length > 0;

  // A different product (or an edited size list) must never keep a stale
  // selection that the shopper can no longer see.
  useEffect(() => {
    setSelectedSize((current) => (current && sizes.includes(current) ? current : ''));
  }, [sizes]);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const showFeedback = useCallback(
    (tone: FeedbackTone, message: string, durationMs: number) => {
      clearFeedbackTimer();
      setFeedback({ tone, message });
      feedbackTimerRef.current = setTimeout(() => {
        feedbackTimerRef.current = null;
        if (isMountedRef.current) setFeedback(null);
      }, durationMs);
    },
    [clearFeedbackTimer]
  );

  const signedIn = isAuthenticated();
  const missingSize = requiresSize && !selectedSize;
  const addToCartDisabled = isAuthLoading || isAddingToCart || (signedIn && missingSize);

  const handleAddToCart = async () => {
    if (isAuthLoading || isAddingToCart) return;

    if (!signedIn) {
      router.push('/login');
      return;
    }

    if (missingSize) {
      showFeedback('error', SIZE_REQUIRED_ERROR, ERROR_DURATION_MS);
      return;
    }

    clearFeedbackTimer();
    setFeedback(null);
    setIsAddingToCart(true);

    try {
      // `size` travels with the line: the data layer treats it as required and
      // falls back to 'M' only for products that carry no size list at all.
      const result = await addItem(null, {
        productId: product.id,
        quantity,
        size: selectedSize
      });

      if (!isMountedRef.current) return;

      if (result && result.success) {
        showFeedback('success', ADD_TO_CART_SUCCESS, SUCCESS_DURATION_MS);
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        showFeedback('error', ADD_TO_CART_ERROR, ERROR_DURATION_MS);
      }
    } catch {
      if (isMountedRef.current) {
        showFeedback('error', ADD_TO_CART_ERROR, ERROR_DURATION_MS);
      }
    } finally {
      if (isMountedRef.current) setIsAddingToCart(false);
    }
  };

  const category = product.category?.trim();
  const unitPrice = product.price || 0;
  const lineSubtotal = unitPrice * quantity;

  const handleWhatsAppShare = () => {
    shareOnWhatsApp({
      product
    });
  };

  return (
    // The buy panel sits on the PDP's PAPER ground: a plate with a hairline
    // and no shadow, not a black card with `shadow-2xl`. Gold on this surface
    // is `zari-700` (4.85:1); `zari-500` would be 1.96:1 and is banned here.
    <div className="rounded-plate border border-line bg-paper-raised p-5 md:p-8">
      {/* Title & Description.

          The signature composite, built by the shared `SectionHeading` rather
          than by hand: category eyebrow, zari thread, then the `h1`. This is
          the page's only `h1`. The category chip that used to sit beside the
          price is gone with it — the same word was then appearing three times
          on one screen (breadcrumb, chip, and the catalogue rail below), and
          the eyebrow is where this design system puts it. */}
      <SectionHeading
        eyebrow={category || FALLBACK_EYEBROW}
        title={product.title}
        as="h1"
        className="mb-4"
      />
      <p className="mb-6 max-w-[62ch] text-lead text-ink-muted">{product.description}</p>

      {/* Price */}
      <div className="mb-8">
        <Price
          amount={unitPrice.toString()}
          currencyCode="INR"
          className="num text-price-lg text-zari-700"
        />
      </div>

      {/* Size Selector */}
      {requiresSize && (
        <fieldset className="m-0 mb-8 border-0 p-0">
          {/* The letterspaced eyebrow is the block label on every PDP section,
              in the cart and in admin — one repeated device is what makes the
              three read as one brand. */}
          <legend className="eyebrow mb-3 p-0 text-ink-muted">
            Select size{' '}
            {selectedSize ? (
              // The chosen chip already carries the metal edge, but the legend
              // is what a screen reader reads when focus enters the group, so
              // the current answer belongs in it too.
              <span className="text-ink">— {selectedSize}</span>
            ) : (
              <span className="font-normal">(required)</span>
            )}
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {sizes.map((size) => {
              const checked = selectedSize === size;

              return (
                <label
                  key={size}
                  className="relative flex cursor-pointer items-center justify-center"
                >
                  <input
                    type="radio"
                    name={sizeGroupName}
                    value={size}
                    checked={checked}
                    onChange={() => setSelectedSize(size)}
                    className="peer sr-only"
                  />
                  {/*
                    The one place a 2px edge is allowed: the selected chip
                    carries a hairline plus an inset ring, both in the metal
                    for paper. The real radio is `sr-only`, so the ring the
                    `peer-focus-visible` utilities draw here is the only focus
                    affordance a keyboard user gets — retoned to `ink`, the
                    same colour the shared focus ring uses.
                  */}
                  <span
                    className={`
                      flex min-h-11 w-full items-center justify-center rounded-control border px-3 py-2 text-body-sm transition-colors duration-fast ease-cloth
                      peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink
                      ${
                        checked
                          ? 'border-zari-700 font-medium text-ink ring-1 ring-inset ring-zari-700'
                          : 'border-line text-ink-muted hover:border-ink-faint hover:text-ink'
                      }
                    `}
                  >
                    {size}
                  </span>
                </label>
              );
            })}
          </div>
          {signedIn && missingSize && (
            <p id={sizeHintId} className="mt-3 text-body-sm text-ink-muted">
              Choose a size to enable Add to Cart.
            </p>
          )}
        </fieldset>
      )}

      {/* Quantity Selector.

          The label is a `<p>`, not an `<h2>`: it labels a control group, and
          as a heading it sat between this page's `h1` and the recommendations
          `h2` as a section that does not exist. `role="group"` plus
          `aria-labelledby` gives assistive tech the association a heading was
          never giving it. */}
      <div className="mb-8">
        <p id={quantityLabelId} className="eyebrow mb-3 text-ink-muted">
          Quantity
        </p>
        <div role="group" aria-labelledby={quantityLabelId} className="flex items-center gap-4">
          {/* 44px square: the touch target the old 32px control never met. */}
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center rounded-control border border-line bg-paper text-h3 leading-none text-ink transition-colors duration-fast ease-cloth hover:bg-paper-sunk disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-paper"
          >
            -
          </button>
          <output aria-live="polite" className="num min-w-12 text-center text-h3 text-ink">
            <span className="sr-only">Quantity: </span>
            {quantity}
          </output>
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            aria-label="Increase quantity"
            className="flex h-11 w-11 items-center justify-center rounded-control border border-line bg-paper text-h3 leading-none text-ink transition-colors duration-fast ease-cloth hover:bg-paper-sunk"
          >
            +
          </button>
        </div>
      </div>

      {/* Line subtotal — the woven rule is the totals separator, here as it is
          in the cart drawer, instead of a boxed grey panel.

          "Subtotal", not "Total": GST is applied on top of the subtotal by
          `computeCartCost`, and shipping is a separate line, so calling
          price x quantity the total was a promise this page cannot keep. The
          two lines under it are the only things this page can state as fact —
          shipping is a flat zero today and GST lands at checkout — so neither
          claims a delivery window or a returns policy nobody has written. */}
      <div className="mb-8">
        <div className="rule-zari" aria-hidden="true" />
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <span className="eyebrow text-ink-muted">Subtotal</span>
          <Price
            amount={lineSubtotal.toString()}
            currencyCode="INR"
            className="num text-price-lg text-zari-700"
          />
        </div>
        <p className="mt-2 text-body-sm text-ink-muted">
          Free delivery. GST calculated at checkout.
        </p>
      </div>

      {/* Add to Cart & WhatsApp Buttons */}
      <div className="mb-8 space-y-4">
        {/*
          The PDP's single filled gold element. `.btn-cart` is `bg-zari-500`
          with `text-ink` (8.16:1) and presses to `zari-600`; the disabled
          recipe is `ink-600` with paper type (11.1:1). Both already carry the
          shared geometry, so there is no local button CSS left here.
        */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addToCartDisabled}
          aria-busy={isAddingToCart}
          aria-describedby={signedIn && missingSize ? sizeHintId : undefined}
          className={addToCartDisabled ? 'btn-cart-disabled' : 'btn-cart'}
        >
          {isAddingToCart
            ? 'Adding…'
            : !isAuthLoading && !signedIn
              ? 'Login to Add to Cart'
              : 'Add to Cart'}
        </button>

        {/* Single feedback region for both success and failure. */}
        <div role="alert" aria-live="assertive" className="min-h-5">
          {feedback && (
            <p
              className={`text-center text-body-sm font-medium ${
                feedback.tone === 'success' ? 'text-neem' : 'text-madder'
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>

        {/*
          Sharing is a secondary action, so it stops being a full-width
          saturated slab and becomes a text action with a thread underline —
          this is also where the share button that used to sit on every
          product card now lives. The mark keeps the `neem` state colour
          (6.85:1 on paper), which is what green-600 maps to.
        */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="thread-link mx-auto flex w-fit items-center gap-2 text-body font-medium text-ink"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            className="h-5 w-5 text-neem"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"></path>
          </svg>
          <span className="hidden sm:inline">Share on WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </button>
      </div>

      {/* Authentication Notice */}
      {!isAuthLoading && !signedIn && (
        <div className="rounded-control border border-line bg-paper p-4">
          {/* The well is `bg-paper`, not `bg-paper-sunk`: `zari-700` is 4.85:1 on
              paper but only 4.42:1 on paper-sunk, which fails AA — paper-sunk is
              the image mat, not a text panel. The hairline, not the fill, is what
              makes this read as a well on the `paper-raised` plate.
              16px, not 13px: `zari-700` is only AA from 16px up, and body copy
              has a 16px floor in this system anyway. */}
          <p className="text-center text-body text-ink-muted">
            Please{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="thread-link font-medium text-zari-700"
            >
              login
            </button>{' '}
            or{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="thread-link font-medium text-zari-700"
            >
              sign up
            </button>{' '}
            to add items to your cart
          </p>
        </div>
      )}
    </div>
  );
}
