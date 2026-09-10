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
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      // The remove chip sits on the drawer's INK ground: an ink-800 disc with
      // an ink-600 hairline at rest, resolving to the `madder` state colour on
      // hover and focus (paper on madder is 6.61:1). Destructive is the one
      // job madder has; it is never decoration.
      className="flex h-5 w-5 items-center justify-center rounded-pill border border-ink-600 bg-ink-800 text-paper-muted transition-colors duration-fast ease-cloth hover:border-madder hover:bg-madder hover:text-paper focus-visible:border-madder focus-visible:bg-madder focus-visible:text-paper disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      aria-label={`Remove ${item.merchandise.product.title} from cart`}
    >
      <span aria-hidden="true" className="text-caption leading-none">
        ×
      </span>
    </button>
  );
}
