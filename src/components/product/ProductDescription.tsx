'use client';

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

  const unitPrice = product.price || 0;
  const totalPrice = unitPrice * quantity;

  const handleWhatsAppShare = () => {
    shareOnWhatsApp({
      product
    });
  };

  return (
    <div className="bg-black text-white p-4 sm:p-6 md:p-8 rounded-lg shadow-2xl border border-gray-800">
      {/* Title & Description */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 leading-tight">{product.title}</h1>
        <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed">{product.description}</p>
      </div>

      {/* Price & Category */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Price amount={unitPrice.toString()} currencyCode="INR" className="text-lg sm:text-xl md:text-2xl font-bold text-[#daa520]" />
          {product.category && (
            <span className="bg-gray-800 text-gray-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm w-fit">
              {product.category}
            </span>
          )}
        </div>
      </div>

      {/* Size Selector */}
      {requiresSize && (
        <fieldset className="mb-4 sm:mb-6 border-0 p-0 m-0">
          <legend className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 p-0">
            Select size <span className="text-gray-400 font-normal text-xs sm:text-sm">(required)</span>
          </legend>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                  <span
                    className={`
                      w-full px-2 sm:px-3 md:px-4 py-2 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm
                      items-center flex justify-center min-h-[40px] sm:min-h-[44px]
                      peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#daa520]
                      ${checked
                        ? 'border-[#daa520] text-[#daa520]'
                        : 'border-gray-600 text-gray-300 hover:border-[#daa520] hover:text-[#daa520]'
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
            <p id={sizeHintId} className="text-gray-300 text-xs sm:text-sm mt-2">
              Choose a size to enable Add to Cart.
            </p>
          )}
        </fieldset>
      )}

      {/* Quantity Selector */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Quantity</h2>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center justify-center font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
          >
            -
          </button>
          <output aria-live="polite" className="text-lg sm:text-xl font-semibold text-white min-w-[2.5rem] sm:min-w-[3rem] text-center">
            <span className="sr-only">Quantity: </span>
            {quantity}
          </output>
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            aria-label="Increase quantity"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center justify-center font-bold text-base sm:text-lg"
          >
            +
          </button>
        </div>
      </div>

      {/* Total Price */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-base sm:text-lg font-semibold text-white">Total:</span>
          <Price amount={totalPrice.toString()} currencyCode="INR" className="text-lg sm:text-xl md:text-2xl font-bold text-[#daa520]" />
        </div>
      </div>

      {/* Add to Cart & WhatsApp Buttons */}
      <div className="space-y-3 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addToCartDisabled}
          aria-busy={isAddingToCart}
          aria-describedby={signedIn && missingSize ? sizeHintId : undefined}
          className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base md:text-lg transition-all duration-200
            ${addToCartDisabled
              ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
              : 'bg-[#daa520] text-black hover:bg-[#b38a1d]'
            }
          `}
        >
          {isAddingToCart ? 'Adding…' : !isAuthLoading && !signedIn ? 'Login to Add to Cart' : 'Add to Cart'}
        </button>

        {/* Single feedback region for both success and failure. */}
        <div role="alert" aria-live="assertive" className="min-h-[1.25rem]">
          {feedback && (
            <p
              className={`text-center text-xs sm:text-sm font-semibold ${
                feedback.tone === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-green-600 text-white rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
        >
          <svg aria-hidden="true" focusable="false" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"></path>
          </svg>
          <span className="hidden sm:inline">Share on WhatsApp</span>
          <span className="sm:hidden">WhatsApp</span>
        </button>
      </div>

      {/* Authentication Notice */}
      {!isAuthLoading && !signedIn && (
        <div className="p-3 sm:p-4 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-gray-300 text-xs sm:text-sm text-center">
            Please{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-[#daa520] hover:text-[#b38a1d] font-semibold underline"
            >
              login
            </button>{' '}
            or{' '}
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="text-[#daa520] hover:text-[#b38a1d] font-semibold underline"
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
