'use client';

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
 * The size the shopper picked, read from the line's own `size` column and
 * falling back to the merchandise options for carts built before that column
 * existed.
 */
function lineSize(line: CartLineWithSize): string | null {
  if (typeof line.size === 'string' && line.size.trim()) {
    return line.size.trim();
  }

  const option = line.merchandise?.selectedOptions?.find(
    entry => entry.name.toLowerCase() === 'size'
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
    setPendingQuantities(current => (Object.keys(current).length === 0 ? current : {}));
    setRemovedLineIds(current => (current.length === 0 ? current : []));
  }, [cart]);

  const closeCart = useCallback(() => {
    setIsOpen(false);
    setActionError(null);
  }, []);

  const lines = useMemo(() => {
    const sourceLines = cart?.lines ?? [];

    return sourceLines
      .filter(line => !removedLineIds.includes(line.id))
      .map(line => {
        const pending = pendingQuantities[line.id];
        return pending === undefined || pending === line.quantity
          ? line
          : { ...line, quantity: pending };
      })
      .filter(line => line.quantity > 0);
  }, [cart, pendingQuantities, removedLineIds]);

  // Same helper the checkout summary and the persisted order use, so the three
  // can never quote the shopper three different numbers.
  const costBreakdown = useMemo(() => computeCartCost(lines), [lines]);
  const totalQuantity = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );

  const applyOptimisticQuantity = useCallback((lineId: string, quantity: number) => {
    setActionError(null);
    setPendingQuantities(current => ({ ...current, [lineId]: quantity }));
  }, []);

  const applyOptimisticRemoval = useCallback((lineId: string) => {
    setActionError(null);
    setRemovedLineIds(current => (current.includes(lineId) ? current : [...current, lineId]));
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
        className={`header-link ml-0 [&>*]:transition-all [&>*]:duration-300 hover:[&>*]:opacity-50 relative ${
          !isAuthenticated() ? 'opacity-70' : ''
        }`}
      >
        <div className="relative">
          <svg className="w-6 h-6 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0h9" />
          </svg>
          {totalQuantity > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#daa520] text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {totalQuantity}
            </span>
          )}
          {!isAuthenticated() && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
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
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-gray-700 bg-black/90 px-4 pb-6 pt-2 text-white backdrop-blur-lg md:w-[390px]">
              <div className="flex items-center justify-between">
                <Dialog.Title as="h2" className="m-0 font-lora text-[28px] font-bold text-white">
                  My Cart
                </Dialog.Title>

                <button ref={closeButtonRef} type="button" aria-label="Close cart" onClick={closeCart}>
                  <CloseCart />
                </button>
              </div>

              {/*
                A permanently mounted live region: a screen reader only
                announces changes inside a region that already existed, and it
                has to outlive the row whose failure it is reporting.
              */}
              <p role="status" aria-live="polite" className="mt-1 text-sm text-red-400 empty:hidden">
                {actionError ?? ''}
              </p>

              {lines.length === 0 ? (
                <div className="mt-20 flex w-full flex-col items-center justify-center overflow-hidden">
                  <Image src="/images/cart.png" width="36" height="36" alt="" />
                  <p className="mt-6 text-center font-quicksand text-2xl font-bold text-white">
                    Your cart is empty.
                  </p>
                </div>
              ) : (
                <div className="flex h-full flex-col justify-between overflow-hidden p-1">
                  <ul className="flex-grow overflow-auto py-4">
                    {lines.map(item => {
                      const size = lineSize(item);
                      const merchandiseUrl = `/product/${item.merchandise.product.handle}`;

                      return (
                        <li key={item.id} className="flex w-full flex-col border-b border-gray-700">
                          <div className="relative flex w-full flex-row justify-between px-1 py-4">
                            <div className="absolute z-40 -mt-2 ml-[55px]">
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
                              <div className="relative h-16 w-16 cursor-pointer overflow-hidden rounded-md bg-gray-800">
                                <Image
                                  className="h-full w-full object-cover"
                                  width={64}
                                  height={64}
                                  alt={item.merchandise.product.title}
                                  src={item.merchandise.product.images[0] || '/images/placeholder.png'}
                                />
                              </div>

                              <div className="flex flex-1 flex-col">
                                <span className="font-lora text-base font-bold leading-tight text-white">
                                  {item.merchandise.product.title}
                                </span>
                                {size && (
                                  <span className="mt-1 font-quicksand text-xs text-gray-300">
                                    Size: {size}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <div className="flex h-16 flex-col justify-between">
                              <Price
                                className="flex justify-end space-y-2 text-right text-sm font-medium text-white"
                                amount={lineTotal(item).toFixed(2)}
                                currencyCode={CURRENCY_CODE}
                              />
                              <div className="ml-auto flex h-9 flex-row items-center rounded-[8px] bg-gray-800 border border-gray-600">
                                <EditItemQuantityButton
                                  item={item}
                                  type="minus"
                                  onOptimisticQuantity={applyOptimisticQuantity}
                                  onResult={handleActionResult}
                                />
                                <p className="w-6 border-x-2 border-gray-600 text-center font-lora font-bold leading-[1] text-white">
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
                  <div className="py-4 font-lora text-sm font-bold text-white">
                    <div className="mb-3 flex items-center justify-between border-b border-gray-700 pb-1">
                      <p>Subtotal</p>
                      <Price
                        className="text-right text-base text-white"
                        amount={costBreakdown.subtotal.toFixed(2)}
                        currencyCode={CURRENCY_CODE}
                      />
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-gray-700 pb-1 pt-1">
                      <p>{GST_LABEL}</p>
                      <Price
                        className="text-right text-base text-white"
                        amount={costBreakdown.gst.toFixed(2)}
                        currencyCode={CURRENCY_CODE}
                      />
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-gray-700 pb-1 pt-1">
                      <p>Shipping</p>
                      {costBreakdown.shipping > 0 ? (
                        <Price
                          className="text-right text-base text-white"
                          amount={costBreakdown.shipping.toFixed(2)}
                          currencyCode={CURRENCY_CODE}
                        />
                      ) : (
                        <p className="text-right text-white">Free</p>
                      )}
                    </div>
                    <div className="mb-3 flex items-center justify-between border-b border-gray-700 pb-1 pt-1">
                      <p>Total</p>
                      <Price
                        className="text-right text-base text-white"
                        amount={costBreakdown.total.toFixed(2)}
                        currencyCode={CURRENCY_CODE}
                      />
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="btn-dark text-center block bg-[#daa520] hover:bg-[#b8860b] text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Proceed to Checkout
                  </Link>

                  <Link
                    href="/orders"
                    onClick={closeCart}
                    className="mt-3 text-center text-sm text-gray-300 hover:text-[#daa520] transition-colors duration-200 underline"
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
