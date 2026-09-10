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
      className="ease flex h-[17px] w-[17px] items-center justify-center rounded-full border border-purple bg-white transition-all duration-200 hover:bg-purple hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      aria-label={`Remove ${item.merchandise.product.title} from cart`}
    >
      <span aria-hidden="true" className="text-[10px] font-bold text-purple hover:text-white">
        ×
      </span>
    </button>
  );
}
