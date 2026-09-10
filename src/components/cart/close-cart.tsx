import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

/**
 * The drawer's dismiss glyph. It sits on the cart panel's INK ground, so the
 * quiet tone is `paper-muted` (8.88:1) resolving to full `paper` on hover.
 *
 * The 44px box is the touch target and stays; the mark inside drops from 40px
 * to 24px, which is an icon rather than a slab. `hover:scale-110` is gone —
 * this direction moves colour, not geometry — and `transition-all` narrows to
 * `transition-colors` at the 160ms colour tempo.
 */
export default function CloseCart({ className }: { className?: string }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-control text-paper-muted transition-colors duration-fast ease-cloth hover:text-paper">
      <XMarkIcon aria-hidden="true" className={clsx('h-6 w-6', className)} />
    </div>
  );
}
