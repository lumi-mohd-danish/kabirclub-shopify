'use client';

import { MAX_LINE_QUANTITY } from '@/lib/supabase/api';

import type { CartLine } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateItemQuantity } from './actions';

/** Mirrors the ceiling the server action enforces, so the UI stops before it does. */

export function EditItemQuantityButton({
  item,
  type,
  onOptimisticQuantity,
  onResult
}: {
  item: CartLine;
  type: 'plus' | 'minus';
  /**
   * Called with the quantity the line is about to have, before the server has
   * confirmed it. The cart drawer renders this straight away so the row does
   * not sit frozen while the round trip happens.
   */
  // eslint-disable-next-line no-unused-vars
  onOptimisticQuantity?: (lineId: string, quantity: number) => void;
  /** Called once the server has answered, so the drawer can report a failure. */
  // eslint-disable-next-line no-unused-vars
  onResult?: (result: { success: boolean; message: string }) => void;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const nextQuantity = type === 'plus' ? item.quantity + 1 : item.quantity - 1;
  // '-' at quantity 1 goes to 0, which the action turns into a removal.
  const isDisabled = isPending || nextQuantity < 0 || nextQuantity > MAX_LINE_QUANTITY;

  const handleClick = async () => {
    if (isDisabled) return;

    setIsPending(true);
    onOptimisticQuantity?.(item.id, nextQuantity);

    try {
      const result = await updateItemQuantity(null, {
        lineId: item.id,
        variantId: item.merchandise.id,
        quantity: nextQuantity
      });

      onResult?.(result);
    } catch {
      onResult?.({
        success: false,
        message: 'We could not update your cart. Please try again.'
      });
    } finally {
      setIsPending(false);

      // Re-read the cart from the source of truth. This replaces the optimistic
      // value with the real one — and puts the old quantity back if the update
      // did not actually land.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={isPending}
      // Stepper ends, on the drawer's INK ground. The hover is a raised ink
      // surface rather than a saturated fill: the stepper is a control, not
      // the view's one gold element.
      className="flex h-full min-w-9 max-w-9 flex-none items-center justify-center rounded-plate px-2 text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
      type="button"
      aria-label={
        type === 'plus'
          ? `Increase quantity of ${item.merchandise.product.title}`
          : `Decrease quantity of ${item.merchandise.product.title}`
      }
    >
      <span aria-hidden="true" className="text-h3 leading-none">
        {type === 'plus' ? '+' : '−'}
      </span>
    </button>
  );
}
