'use client';

import { useAuth } from '@/hooks/useAuth';
import SectionHeading from '@/components/common/SectionHeading';
import { getOrdersForSession } from '@/components/cart/actions';
import {
  formatStatusLabel,
  orderStatusChipClass,
  paymentStatusChipClass
} from '@/lib/order-status';
import { isSupabaseConfigured } from '@/lib/supabase';
import { GST_RATE } from '@/lib/supabase/api';
import { Order } from '@/lib/supabase/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

// Force dynamic rendering to avoid localStorage issues
export const dynamic = 'force-dynamic';

// Pinned to en-IN so the server and the browser always agree on grouping and
// symbol, and so raw floating point totals (243.07999999999998) never reach the
// screen.
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatPrice = (value: number | string | null | undefined): string => {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  return inrFormatter.format(typeof amount === 'number' && Number.isFinite(amount) ? amount : 0);
};

const GST_LABEL = `GST (${Math.round(GST_RATE * 100)}%)`;

/**
 * The number the shopper was handed on the confirmation screen. Derived the
 * same way there (`id.slice(0, 8).toUpperCase()`) so the receipt and the
 * confirmation cannot print two different names for one order.
 */
const orderNumber = (id: string): string => (id ?? '').slice(0, 8).toUpperCase();

/**
 * State iconography, not decoration — the same pill-cut hairline badge the
 * root error boundary and the checkout confirmation use. It replaces the two
 * emoji that were set at `text-6xl`: a size that is not on the type scale, and
 * a glyph whose colour and weight the system cannot control.
 */
function StateBadge({ tone, children }: { tone: 'quiet' | 'error'; children: ReactNode }) {
  return (
    <span
      className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-pill border border-line-strong bg-paper-sunk ${
        tone === 'error' ? 'text-madder' : 'text-ink-muted'
      }`}
    >
      {children}
    </span>
  );
}

function AlertIcon() {
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
      <path d="M10.3 3.9 1.8 18.4A2 2 0 0 0 3.5 21.4h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ParcelIcon() {
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
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z" />
      <path d="m3 7.5 9 4.5 9-4.5" />
      <path d="M12 12v9" />
    </svg>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const hasFetchedOrders = useRef(false); // Prevent multiple fetches

  // One escape hatch for a stuck auth check, not two racing ones. The pair of
  // timers here (3s and 2s) both set the same flag, so the 3s one could never
  // fire first and the comment claiming otherwise was describing dead code.
  useEffect(() => {
    if (!authLoading) return;

    const timer = setTimeout(() => setLoadingTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, [authLoading]);

  const fetchOrders = useCallback(async () => {
    // Prevent multiple fetches
    if (hasFetchedOrders.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // With no Supabase credentials the storefront runs on sample data and no
      // order can exist, so `getOrders` throwing "not configured" is not a
      // failure the shopper caused or can retry out of. Answer it the honest
      // way — with the empty state — instead of a red "something went wrong".
      if (!isSupabaseConfigured()) {
        setOrders([]);
        hasFetchedOrders.current = true;
        return;
      }

      // The session cookie is httpOnly, so the read happens server-side: the
      // action resolves the session AND the orders in one round trip, and
      // answers `[]` for a visitor who has never had a cart — which is the
      // empty state below, not an error.
      const ordersData = await getOrdersForSession();
      setOrders(ordersData || []);
      hasFetchedOrders.current = true; // Mark as fetched
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  useEffect(() => {
    // Wait for auth to be initialized
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated() || !user) {
      router.push('/login');
      return;
    }

    // User is authenticated, fetch orders (only once)
    if (!hasFetchedOrders.current) {
      fetchOrders();
    }
  }, [authLoading, user, fetchOrders, isAuthenticated, router]); // Added missing dependencies

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (authLoading && !loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="container-page text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-pill border-b-2 border-zari-700"></div>
          <p className="text-lead text-ink-muted">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Timeout state
  if (loadingTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="container-page text-center">
          <SectionHeading eyebrow="Orders" title="Authentication timeout" as="h1" align="center" />
          <p className="mt-3 text-body text-ink-muted">
            Please refresh the page or try logging in again
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary">
              Refresh Page
            </button>
            <Link href="/login" className="btn-secondary">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Auth error state
  if (!isAuthenticated() || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="container-page text-center">
          <SectionHeading eyebrow="Orders" title="Authentication required" as="h1" align="center" />
          <p className="mt-3 text-body text-ink-muted">Please log in to view your orders</p>
          <Link href="/login" className="btn-primary mt-8">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="container-page text-center">
          <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-pill border-b-2 border-zari-700"></div>
          <SectionHeading eyebrow="Orders" title="Loading your orders..." as="h1" align="center" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="container-page text-center">
          <StateBadge tone="error">
            <AlertIcon />
          </StateBadge>
          <SectionHeading eyebrow="Orders" title="Something went wrong" as="h1" align="center" />
          <p role="alert" className="mt-3 text-body text-madder">
            {error}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={fetchOrders} className="btn-primary">
              Try Again
            </button>
            <button onClick={() => router.push('/')} className="btn-secondary">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No orders state
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <div className="section container-page">
          <div className="text-center">
            <StateBadge tone="quiet">
              <ParcelIcon />
            </StateBadge>
            <SectionHeading eyebrow="Orders" title="No orders yet" as="h1" align="center" />
            <p className="mx-auto mt-4 max-w-[46ch] text-body text-ink-muted">
              Nothing has been placed from this device yet. Once an order goes through, its number,
              status and full receipt live here.
            </p>
            <button onClick={() => router.push('/')} className="btn-primary mt-8">
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="section container-page">
        {/* Header */}
        <div className="mb-10 text-center">
          <SectionHeading eyebrow="Account" title="My Orders" as="h1" align="center" />
          <p className="mt-3 text-body text-ink-muted">
            Track your order status and view order details
          </p>
        </div>

        {/* Navigation Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center justify-center gap-2 text-body-sm text-ink-muted"
        >
          <Link href="/" className="thread-link text-ink-muted">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">My Orders</span>
        </nav>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-plate border border-line bg-paper-raised p-6 md:p-8"
            >
              {/* Order Header */}
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="num text-h3 tracking-wide text-ink">
                    Order #{orderNumber(order.id)}
                  </h3>
                  <p className="num mt-1 text-body-sm text-ink-muted">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={orderStatusChipClass(order.orderStatus)}>
                    {formatStatusLabel(order.orderStatus)}
                  </span>
                  <span className={paymentStatusChipClass(order.paymentStatus)}>
                    {formatStatusLabel(order.paymentStatus)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="eyebrow text-ink-muted">Order Items</h4>
                <div className="mt-3">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id || `${order.id}-${index}`}
                      className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="text-body font-medium text-ink">{item.product.title}</p>
                        <p className="num mt-1 text-body-sm text-ink-muted">
                          Size: {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num text-body font-medium text-ink">
                          {formatPrice(item.totalPrice)}
                        </p>
                        <p className="num mt-1 text-body-sm text-ink-muted">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary. Subtotal -> GST -> Shipping -> Total: the
                  order the drawer and the checkout summary print, so a shopper
                  comparing the receipt against what they were quoted is
                  reading the same four lines in the same sequence. */}
              {/* `bg-paper`, not `paper-raised`: this panel sits INSIDE a
                  paper-raised card, where raised-on-raised is 1:1 and the
                  plate simply disappears. Not `paper-sunk` either — that is
                  the image mat, and zari-700 only clears 4.42:1 on it, which
                  the Total below would fail. On paper it is 4.85:1. */}
              <div className="mb-6 rounded-plate border border-line bg-paper p-5">
                <p className="eyebrow mb-3 text-ink-muted">Summary</p>
                <dl>
                  <div className="flex items-center justify-between gap-4 py-1">
                    <dt className="text-body text-ink-muted">Subtotal</dt>
                    <dd className="num text-body text-ink">{formatPrice(order.subtotal)}</dd>
                  </div>
                  {/* `orders` has no tax column, so GST is derived the way the
                    data layer documents it: total - subtotal - shipping.
                    Without this row the printed figures do not add up. */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <dt className="num text-body text-ink-muted">{GST_LABEL}</dt>
                    <dd className="num text-body text-ink">
                      {formatPrice(
                        Math.max(0, order.totalAmount - order.subtotal - order.shippingCost)
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-1">
                    <dt className="text-body text-ink-muted">Shipping</dt>
                    <dd className="num text-body text-ink">
                      {order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}
                    </dd>
                  </div>
                  <div className="rule-zari my-3" aria-hidden="true" />
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-body font-medium text-ink">Total</dt>
                    <dd className="num text-price text-zari-700">
                      {formatPrice(order.totalAmount)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Shipping Address */}
              <div className="mb-6">
                <h4 className="eyebrow text-ink-muted">Shipping Address</h4>
                <address className="mt-3 rounded-plate border border-line bg-paper p-5 text-body not-italic text-ink-muted">
                  <span className="block font-medium text-ink">
                    {order.shippingAddress.fullName}
                  </span>
                  <span className="block">{order.shippingAddress.addressLine1}</span>
                  {order.shippingAddress.addressLine2 && (
                    <span className="block">{order.shippingAddress.addressLine2}</span>
                  )}
                  <span className="block">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    <span className="num">{order.shippingAddress.postalCode}</span>
                  </span>
                  <span className="block">{order.shippingAddress.country}</span>
                  <span className="num block">Phone: {order.shippingAddress.phone}</span>
                </address>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="eyebrow text-ink-muted">Payment Method</h4>
                <div className="mt-3 rounded-plate border border-line bg-paper p-5">
                  <p className="text-body font-medium capitalize text-ink">
                    {order.paymentMethod.replace('_', ' ')}
                  </p>
                  {order.paymentMethod === 'upi' && order.upiId && (
                    <p className="mt-1 text-body-sm text-ink-muted">UPI ID: {order.upiId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="mt-10 text-center">
          <button onClick={() => router.push('/')} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
