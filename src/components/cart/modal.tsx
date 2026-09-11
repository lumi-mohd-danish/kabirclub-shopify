'use client';

import SectionHeading from '@/components/common/SectionHeading';
import Price from '@/components/common/price';
import { useAuth } from '@/hooks/useAuth';
import {
  CURRENCY_CODE,
  GST_RATE,
  computeCartCost,
  type CartLineWithSize,
  type CartWithSizes
} from '@/lib/supabase/api';
import { Dialog, Transition } from '@headlessui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CloseCart from './close-cart';
import { DeleteItemButton } from './delete-item-button';
import { EditItemQuantityButton } from './edit-item-quantity-button';

const GST_LABEL = `GST (${Math.round(GST_RATE * 100)}%)`;

/**
 * The bag glyph, drawn rather than imported.
 *
 * The empty state used to render `/images/cart.png` at 36px — a raster whose
 * colour the system cannot touch, sitting on an ink ground it was never cut
 * for. This is the same 1.5px stroked figure the error and confirmation badges
 * use, so it takes its colour from the token on the wrapper.
 */
function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.5 7.5h13l1 12.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1Z" />
      <path d="M8.75 10V6.25a3.25 3.25 0 0 1 6.5 0V10" />
    </svg>
  );
}

/**
 * The size the shopper picked, read from the line's own `size` column and
 * falling back to the merchandise options for carts built before that column
 * existed.
 */
function lineSize(line: CartLineWithSize): string | null {
  if (typeof line.size === 'string' && line.size.trim()) {
    return line.size.trim();
  }

  const option = line.merchandise?.selectedOptions?.find(
    (entry) => entry.name.toLowerCase() === 'size'
  );

  return option && option.value.trim() ? option.value.trim() : null;
}

/** Whole-line amount: unit price x quantity, not the unit price on its own. */
function lineTotal(line: CartLineWithSize): number {
  const unitPrice = Number(line.merchandise?.product?.price);
  return (Number.isFinite(unitPrice) ? unitPrice : 0) * line.quantity;
}

export default function CartModal({
  cart,
  onCartClick
}: {
  cart: CartWithSizes | undefined;
  onCartClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Optimistic overlay on top of the server's cart. Quantity edits and
  // deletions land here first so the drawer reacts to a click immediately; the
  // next cart that arrives from the server clears the overlay.
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});
  const [removedLineIds, setRemovedLineIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    // A freshly fetched cart is the truth, so the guesses layered on the
    // previous one are discarded — including guesses that turned out wrong.
    // Returning the same value when there is nothing to clear avoids an extra
    // render on every cart refresh.
    setPendingQuantities((current) => (Object.keys(current).length === 0 ? current : {}));
    setRemovedLineIds((current) => (current.length === 0 ? current : []));
  }, [cart]);

  const closeCart = useCallback(() => {
    setIsOpen(false);
    setActionError(null);
  }, []);

  const lines = useMemo(() => {
    const sourceLines = cart?.lines ?? [];

    return sourceLines
      .filter((line) => !removedLineIds.includes(line.id))
      .map((line) => {
        const pending = pendingQuantities[line.id];
        return pending === undefined || pending === line.quantity
          ? line
          : { ...line, quantity: pending };
      })
      .filter((line) => line.quantity > 0);
  }, [cart, pendingQuantities, removedLineIds]);

  // Same helper the checkout summary and the persisted order use, so the three
  // can never quote the shopper three different numbers.
  const costBreakdown = useMemo(() => computeCartCost(lines), [lines]);
  const totalQuantity = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  const applyOptimisticQuantity = useCallback((lineId: string, quantity: number) => {
    setActionError(null);
    setPendingQuantities((current) => ({ ...current, [lineId]: quantity }));
  }, []);

  const applyOptimisticRemoval = useCallback((lineId: string) => {
    setActionError(null);
    setRemovedLineIds((current) => (current.includes(lineId) ? current : [...current, lineId]));
  }, []);

  const handleActionResult = useCallback((result: { success: boolean; message: string }) => {
    setActionError(result.success ? null : result.message);
  }, []);

  const handleCartButtonClick = () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (onCartClick) {
      onCartClick();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <button
        aria-label="Open cart"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={handleCartButtonClick}
        /*
          The trigger lives in the header's INK band, so its quiet tone is
          `paper-muted` resolving to `paper`. The old `[&>*]:transition-all`
          pair faded the whole icon to 50% opacity on hover, which is a
          contrast loss dressed as feedback; a colour change says the same
          thing without dimming anything. The thread underline came off too —
          an icon button has nothing to underline.
        */
        className={`relative ml-0 text-paper-muted transition-colors duration-fast ease-cloth hover:text-paper ${
          !isAuthenticated() ? 'opacity-70' : ''
        }`}
      >
        <div className="relative">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0h9"
            />
          </svg>
          {totalQuantity > 0 && (
            /* A gold FILL, so the figure on it is ink (8.16:1), not white. */
            <span className="num absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-pill bg-zari-500 text-caption font-medium text-ink">
              {totalQuantity}
            </span>
          )}
          {!isAuthenticated() && (
            <div className="absolute -right-1 -top-1 h-2 w-2 rounded-pill bg-madder"></div>
          )}
        </div>
      </button>
      {/*
        Headless UI's Dialog already gives us the keyboard contract: it reads its
        open state from the enclosing Transition, closes on Escape via `onClose`,
        traps Tab inside the panel while open and restores focus to the trigger
        on close. What it was missing is a Dialog.Title — without one the drawer
        has no accessible name — and a deterministic initial focus target.
      */}
      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50" initialFocus={closeButtonRef}>
          {/*
            Retimed to the panel tempo (420ms, ease-cloth) and narrowed off
            `transition-all`. Both `backdrop-blur-[.5px]` utilities are gone —
            half a pixel of blur is imperceptible and it forced a compositor
            layer over the whole viewport for nothing.
          */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-panel ease-cloth"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-panel ease-cloth"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink-900/60" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-panel ease-cloth"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-panel ease-cloth"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            {/*
              The drawer is an INK panel: solid `ink-900`, an `ink-700`
              hairline down its edge and `shadow-overlay` to lift it off the
              page. It was `bg-black/90` behind a `backdrop-blur-lg`, which is
              a lot of paint for a surface that should simply be opaque.
            */}
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-ink-700 bg-ink-900 px-5 pb-6 pt-4 text-paper shadow-overlay md:w-96">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow text-zari-500">Your selection</p>
                  <Dialog.Title as="h2" className="m-0 mt-2 font-display text-h2 text-paper">
                    My Cart
                  </Dialog.Title>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Close cart"
                  onClick={closeCart}
                >
                  <CloseCart />
                </button>
              </div>

              {/*
                A permanently mounted live region: a screen reader only
                announces changes inside a region that already existed, and it
                has to outlive the row whose failure it is reporting.
              */}
              <p
                role="status"
                aria-live="polite"
                className="mt-3 rounded-control bg-madder px-3 py-2 text-body-sm text-paper empty:hidden"
              >
                {actionError ?? ''}
              </p>

              {lines.length === 0 ? (
                /*
                  A designed empty state, not a dead end. It carries the full
                  heading composite (badge -> eyebrow -> thread -> heading), one
                  line of copy that says what the drawer is FOR, and the two
                  routes out — the catalogue, and the order history for a
                  shopper who opened the cart looking for something they have
                  already bought.
                */
                <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-2 py-8 text-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-pill border border-ink-700 bg-ink-800 text-paper-muted">
                    <BagIcon />
                  </span>

                  <SectionHeading
                    eyebrow="Nothing here yet"
                    title="Your cart is empty"
                    as="h3"
                    align="center"
                    tone="ink"
                    density="compact"
                    className="mt-5"
                  />

                  <p className="mt-4 max-w-[34ch] text-body-sm text-paper-muted">
                    Anything you add is held here while you keep looking. Sizes and quantities can
                    be changed right up to checkout.
                  </p>

                  <Link href="/" onClick={closeCart} className="btn-cart mt-8">
                    Browse the collection
                  </Link>

                  <Link
                    href="/orders"
                    onClick={closeCart}
                    className="thread-link-ink mt-5 text-body-sm text-paper-muted hover:text-zari-500"
                  >
                    View My Orders
                  </Link>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between overflow-hidden p-1">
                  <ul className="flex-grow overflow-auto py-4">
                    {lines.map((item) => {
                      const size = lineSize(item);
                      const merchandiseUrl = `/product/${item.merchandise.product.handle}`;

                      return (
                        <li key={item.id} className="flex w-full flex-col border-b border-ink-700">
                          <div className="relative flex w-full flex-row justify-between px-1 py-4">
                            <div className="absolute z-40 -mt-2 ml-14">
                              <DeleteItemButton
                                item={item}
                                onOptimisticRemove={applyOptimisticRemoval}
                                onResult={handleActionResult}
                              />
                            </div>
                            <Link
                              href={merchandiseUrl}
                              onClick={closeCart}
                              className="z-30 flex flex-row space-x-4"
                            >
                              <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-plate bg-paper-sunk">
                                <Image
                                  className="h-full w-full object-cover"
                                  width={64}
                                  height={64}
                                  alt={item.merchandise.product.title}
                                  src={
                                    item.merchandise.product.images[0] || '/images/placeholder.png'
                                  }
                                />
                              </div>

                              <div className="flex flex-1 flex-col">
                                <span className="line-clamp-2 text-body font-medium text-paper">
                                  {item.merchandise.product.title}
                                </span>
                                {/* The size is an attribute of the line, not a
                                    caption under it: a chip on the raised ink
                                    surface, so it survives a two-line title
                                    and reads at a glance. Screen readers get
                                    the word "Size" with it. */}
                                {size ? (
                                  <span className="mt-2 inline-flex w-fit items-center rounded-control border border-ink-600 bg-ink-800 px-2 py-0.5 text-caption text-paper-muted">
                                    Size {size}
                                  </span>
                                ) : null}
                              </div>
                            </Link>
                            <div className="flex h-16 flex-col justify-between">
                              <Price
                                className="num text-right text-body font-medium text-paper"
                                amount={lineTotal(item).toFixed(2)}
                                currencyCode={CURRENCY_CODE}
                              />
                              <div className="ml-auto flex h-9 flex-row items-center overflow-hidden rounded-control border border-ink-600 bg-ink-800">
                                <EditItemQuantityButton
                                  item={item}
                                  type="minus"
                                  onOptimisticQuantity={applyOptimisticQuantity}
                                  onResult={handleActionResult}
                                />
                                <p className="num w-8 border-x border-ink-600 text-center text-body leading-none text-paper">
                                  <span className="w-full">{item.quantity}</span>
                                </p>
                                <EditItemQuantityButton
                                  item={item}
                                  type="plus"
                                  onOptimisticQuantity={applyOptimisticQuantity}
                                  onResult={handleActionResult}
                                />
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="py-4 text-body-sm text-paper-muted">
                    <div className="mb-3 flex items-center justify-between border-b border-ink-700 pb-2">
                      <p>Subtotal</p>
                      <Price
                        className="num text-right text-body text-paper"
                        amount={costBreakdown.subtotal.toFixed(2)}
                        currencyCode={CURRENCY_CODE}
                      />
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-ink-700 pb-2">
                      <p>{GST_LABEL}</p>
                      <Price
                        className="num text-right text-body text-paper"
                        amount={costBreakdown.gst.toFixed(2)}
                        currencyCode={CURRENCY_CODE}
                      />
                    </div>
                    <div className="mb-4 flex items-center justify-between border-b border-ink-700 pb-2">
                      <p>Shipping</p>
                      {costBreakdown.shipping > 0 ? (
                        <Price
                          className="num text-right text-body text-paper"
                          amount={costBreakdown.shipping.toFixed(2)}
                          currencyCode={CURRENCY_CODE}
                        />
                      ) : (
                        <p className="text-right text-body text-paper">Free</p>
                      )}
                    </div>

                    {/* The woven rule is the totals separator, and the Total
                        itself is the one line in zari-300 (11.44:1 on ink). */}
                    <div className="rule-zari" aria-hidden="true" />
                    <div className="mt-4 flex items-baseline justify-between">
                      <p className="eyebrow text-paper-muted">Total</p>
                      <Price
                        className="num text-right text-price-lg text-zari-300"
                        amount={costBreakdown.total.toFixed(2)}
                        currencyCode={CURRENCY_CODE}
                      />
                    </div>
                  </div>

                  {/* The drawer's single filled gold element. */}
                  <Link href="/checkout" onClick={closeCart} className="btn-cart">
                    Proceed to Checkout
                  </Link>

                  <Link
                    href="/orders"
                    onClick={closeCart}
                    className="thread-link-ink mt-4 self-center text-body-sm text-paper-muted hover:text-zari-500"
                  >
                    View My Orders
                  </Link>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
