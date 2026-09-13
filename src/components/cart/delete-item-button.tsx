'use client';

import type { CartLine } from '@/lib/supabase/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { removeItem } from './actions';

export function DeleteItemButton({
  item,
  onOptimisticRemove,
  onResult
}: {
  item: CartLine;
  /**
   * Called before the server has confirmed the deletion so the cart drawer can
   * drop the row immediately instead of looking frozen. If the delete turns out
   * to have failed, the refetch triggered below puts the row back.
   */
  // eslint-disable-next-line no-unused-vars
  onOptimisticRemove?: (lineId: string) => void;
  /** Called once the server has answered, so the drawer can report a failure. */
  // eslint-disable-next-line no-unused-vars
  onResult?: (result: { success: boolean; message: string }) => void;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    if (isPending) return;

    setIsPending(true);
    onOptimisticRemove?.(item.id);

    try {
      const result = await removeItem(null, item.id);
      onResult?.(result);
    } catch {
      onResult?.({
        success: false,
        message: 'We could not remove that item. Please try again.'
      });
    } finally {
      setIsPending(false);

      // Resync with the database: confirms the removal, or restores the line.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
      router.refresh();
    }
  };

  return (
    // The target is 24x24 — the WCAG 2.2 SC 2.5.8 floor — while the disc keeps
    // its 20px drawing. The chip is absolutely positioned over the product
    // thumbnail, so no spacing exception applies and the padding has to be real
    // hit area. `-m-0.5` gives the extra 2px back to the layout, so the disc
    // still lands exactly where it did before.
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      className="group -m-0.5 flex h-6 w-6 items-center justify-center rounded-pill disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      aria-label={`Remove ${item.merchandise.product.title} from cart`}
    >
      {/* The remove chip sits on the drawer's INK ground: an ink-800 disc with
          an ink-600 hairline at rest, resolving to the `madder` state colour on
          hover and focus (paper on madder is 6.61:1). Destructive is the one
          job madder has; it is never decoration. */}
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-pill border border-ink-600 bg-ink-800 text-caption leading-none text-paper-muted transition-colors duration-fast ease-cloth group-hover:border-madder group-hover:bg-madder group-hover:text-paper group-focus-visible:border-madder group-focus-visible:bg-madder group-focus-visible:text-paper"
      >
        ×
      </span>
    </button>
  );
}
