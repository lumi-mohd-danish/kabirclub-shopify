// next
import Image from 'next/image';

/**
 * The header's cart affordance. The count badge is the one place the pill
 * radius is allowed alongside avatars, and it is a gold FILL — which means the
 * type on it is `ink` (8.16:1), never white (1.58:1, the bug Phase 0 fixed).
 */
export default function OpenCart({ quantity }: { quantity?: number }) {
  return (
    <div className="relative">
      <Image src="/images/cart.png" width="36" height="36" alt="cart" />
      {quantity ? (
        <div
          className="num absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-pill bg-zari-500 text-caption font-medium text-ink"
          role="figure"
        >
          {quantity}
        </div>
      ) : null}
    </div>
  );
}
