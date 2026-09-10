'use server';

import { addToCart, removeFromCart, updateCartItem,
  MAX_LINE_QUANTITY
} from '@/lib/supabase/api';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Cart server actions.
 *
 * Two rules hold everywhere in this file:
 *
 *  1. The cart session id is a `crypto.randomUUID()` written to an **httpOnly**
 *     cookie. It is the only thing standing between a shopper and their cart and
 *     order history, so it must be unguessable and unreadable from page
 *     JavaScript. Browser code obtains it through the `getCartSessionId` action
 *     below, never through `document.cookie`.
 *
 *  2. Nothing internal ever reaches the shopper. Every returned `message` is
 *     written for a customer; the underlying cause is logged on the server.
 *
 * Every action also has to behave sensibly when Supabase is not configured: the
 * data layer then returns `null`/`false` rather than throwing, which is reported
 * here as a plain "cart unavailable" message instead of a broken screen.
 */

/** Name of the cart session cookie. httpOnly — see rule 1 above. */
const SESSION_COOKIE_NAME = 'sessionId';

/** Six months: long enough that a returning shopper keeps their cart. */
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

/** Upper bound on a single cart line, so a crafted request cannot order 10^9 shirts. */


/** Size used when a caller supplies none (the legacy string payload shape). */
const DEFAULT_SIZE = 'M';

/**
 * Result of a cart action.
 *
 * `message` is always safe to render to a shopper. `error` carries the same
 * customer-facing text and exists only so call sites that read `result.error`
 * keep working.
 */
interface CartActionResult {
  success: boolean;
  message: string;
  error?: string;
}

const MESSAGES = {
  added: 'Added to your cart.',
  removed: 'Removed from your cart.',
  updated: 'Your cart has been updated.',
  missingProduct: "We couldn't tell which product to add. Please refresh the page and try again.",
  missingLine: "We couldn't find that item in your cart. Please refresh the page and try again.",
  unavailable: 'Your cart is unavailable right now. Please try again in a few moments.',
  generic: 'Something went wrong. Please try again.'
};

function succeeded(message: string): CartActionResult {
  return { success: true, message };
}

function failed(message: string): CartActionResult {
  return { success: false, message, error: message };
}

/** Server-side only. The shopper sees `MESSAGES.generic`, never this. */
function logCartFailure(action: string, cause: unknown): void {
  console.error(`[cart] ${action} failed:`, cause);
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Coerce anything a client might send into a sane line quantity. */
function clampQuantity(value: unknown): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, MAX_LINE_QUANTITY);
}

function readSessionId(): string | null {
  return trimmedString(cookies().get(SESSION_COOKIE_NAME)?.value) || null;
}

/**
 * Return the shopper's cart session, minting one on first use.
 *
 * `crypto.randomUUID()` gives 122 bits of entropy from a CSPRNG. The previous
 * `Math.random().toString(36)` id was both low-entropy and predictable, which
 * meant one shopper could land on another's cart and order history.
 */
function ensureSessionId(): string {
  const existing = readSessionId();
  if (existing) return existing;

  const sessionId = crypto.randomUUID();

  cookies().set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE
  });

  return sessionId;
}

/** Pages whose server render depends on cart contents. There is no `/cart` route. */
function revalidateCart(): void {
  revalidatePath('/');
  revalidatePath('/checkout');
}

/**
 * The browser's only way to learn its own cart session id, now that the cookie
 * is httpOnly. Read-only: it never mints a session, so simply loading a page
 * does not create one.
 */
export async function getCartSessionId(): Promise<string | null> {
  return readSessionId();
}

/**
 * Add a product to the cart.
 *
 * Accepts either `{ productId, quantity, size }` or a bare product id (the older
 * call shape). The selected size is threaded through to the data layer, so the
 * size the shopper picked is the size that reaches the order.
 */
export async function addItem(
  prevState: unknown,
  payload: { productId: string; quantity?: number; size?: string } | string
): Promise<CartActionResult> {
  const isLegacyPayload = typeof payload === 'string';
  const productId = isLegacyPayload ? trimmedString(payload) : trimmedString(payload?.productId);

  if (!productId) {
    return failed(MESSAGES.missingProduct);
  }

  const quantity = isLegacyPayload ? 1 : clampQuantity(payload?.quantity);
  const size = (isLegacyPayload ? '' : trimmedString(payload?.size)) || DEFAULT_SIZE;
  const sessionId = ensureSessionId();

  try {
    const line = await addToCart({ productId, quantity, size, sessionId });

    if (!line) {
      // Supabase unconfigured, or the insert was rejected. Either way the
      // shopper only needs to know the cart did not accept the item.
      return failed(MESSAGES.unavailable);
    }

    revalidateCart();
    return succeeded(MESSAGES.added);
  } catch (cause) {
    logCartFailure('addItem', cause);
    return failed(MESSAGES.generic);
  }
}

export async function removeItem(prevState: unknown, lineId: string): Promise<CartActionResult> {
  const itemId = trimmedString(lineId);

  if (!itemId) {
    return failed(MESSAGES.missingLine);
  }

  // Scope the delete to this visitor's own cart session.
  const sessionId = readSessionId();

  if (!sessionId) {
    return failed(MESSAGES.missingLine);
  }

  try {
    if (!(await removeFromCart(itemId, sessionId))) {
      return failed(MESSAGES.unavailable);
    }

    revalidateCart();
    return succeeded(MESSAGES.removed);
  } catch (cause) {
    logCartFailure('removeItem', cause);
    return failed(MESSAGES.generic);
  }
}

/**
 * Set the quantity (and optionally the size) of a cart line.
 *
 * A requested quantity below 1 removes the line, because `updateCartItem`
 * deliberately clamps to at least 1.
 */
export async function updateItemQuantity(
  prevState: unknown,
  payload: {
    lineId: string;
    variantId?: string;
    quantity: number;
    size?: string;
  }
): Promise<CartActionResult> {
  const itemId = trimmedString(payload?.lineId);

  if (!itemId) {
    return failed(MESSAGES.missingLine);
  }

  const requestedQuantity = Math.floor(Number(payload?.quantity));
  const size = trimmedString(payload?.size);

  // Scope the write to this visitor's own cart session.
  const sessionId = readSessionId();

  if (!sessionId) {
    return failed(MESSAGES.missingLine);
  }

  try {
    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 1) {
      if (!(await removeFromCart(itemId, sessionId))) {
        return failed(MESSAGES.unavailable);
      }

      revalidateCart();
      return succeeded(MESSAGES.removed);
    }

    const line = await updateCartItem({
      itemId,
      quantity: Math.min(requestedQuantity, MAX_LINE_QUANTITY),
      sessionId,
      ...(size ? { size } : {})
    });

    if (!line) {
      return failed(MESSAGES.unavailable);
    }

    revalidateCart();
    return succeeded(MESSAGES.updated);
  } catch (cause) {
    logCartFailure('updateItemQuantity', cause);
    return failed(MESSAGES.generic);
  }
}
