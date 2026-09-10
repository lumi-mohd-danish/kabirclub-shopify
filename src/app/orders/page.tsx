'use client';

import { useAuth } from '@/hooks/useAuth';
import { getCartSessionId } from '@/components/cart/actions';
import { GST_RATE, getOrders } from '@/lib/supabase/api';
import { Order } from '@/lib/supabase/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

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

export default function OrdersPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const hasFetchedOrders = useRef(false); // Prevent multiple fetches

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setLoadingTimeout(true);
      }
    }, 3000); // Reduced to 3 seconds

    return () => clearTimeout(timer);
  }, [authLoading]);

  // Force loading to complete if stuck
  useEffect(() => {
    const forceCompleteTimer = setTimeout(() => {
      if (authLoading) {
        // Force the component to render with current state
        setLoadingTimeout(true);
      }
    }, 2000); // 2 seconds

    return () => clearTimeout(forceCompleteTimer);
  }, [authLoading]);

  const fetchOrders = useCallback(async () => {
    // Prevent multiple fetches
    if (hasFetchedOrders.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const sessionId = await getSessionId();
      if (!sessionId) {
        setError('You have no orders yet. Add something to your cart to get started.');
        return;
      }

      const ordersData = await getOrders(sessionId);
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

  // The cart session cookie is httpOnly, so it is deliberately invisible to
  // `document.cookie`. The server action is the only way to read it.
  const getSessionId = (): Promise<string | null> => getCartSessionId();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600 text-yellow-100';
      case 'confirmed':
        return 'bg-blue-600 text-blue-100';
      case 'shipped':
        return 'bg-purple-600 text-purple-100';
      case 'delivered':
        return 'bg-green-600 text-green-100';
      case 'cancelled':
        return 'bg-red-600 text-red-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-600 text-green-100';
      case 'pending':
        return 'bg-yellow-600 text-yellow-100';
      case 'failed':
        return 'bg-red-600 text-red-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#daa520] mx-auto mb-4"></div>
          <p className="text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Timeout state
  if (loadingTimeout) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Authentication timeout</p>
          <p className="text-gray-400 mb-6">Please refresh the page or try logging in again</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-[#daa520] hover:bg-[#b8860b] text-black font-bold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Refresh Page
            </button>
            <Link 
              href="/login" 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
            >
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Authentication required</p>
          <p className="text-gray-400 mb-6">Please log in to view your orders</p>
          <Link 
            href="/login" 
            className="bg-[#daa520] hover:bg-[#b38a1d] text-black font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#daa520] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white">Loading your orders...</h1>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchOrders}
              className="bg-[#daa520] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#b38a1d] mr-3"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600"
            >
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
      <div className="min-h-screen bg-black text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-3xl font-bold text-[#daa520] mb-4">No Orders Yet</h1>
            <p className="text-gray-400 mb-6">You haven&apos;t placed any orders yet. Start shopping to see your orders here!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#daa520] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#b38a1d]"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#daa520]">My Orders</h1>
          <p className="text-gray-400 mt-2">Track your order status and view order details</p>
        </div>

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-center mb-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-[#daa520] transition-colors duration-200">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#daa520]">My Orders</span>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-gray-400 text-sm">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="text-base font-semibold text-white mb-3">Order Items:</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.product.title}</p>
                        <p className="text-gray-400 text-sm">
                          Size: {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatPrice(item.totalPrice)}</p>
                        <p className="text-gray-400 text-sm">{formatPrice(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Subtotal:</span>
                  <span className="text-white">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Shipping:</span>
                  <span className="text-white">{formatPrice(order.shippingCost)}</span>
                </div>
                {/* `orders` has no tax column, so GST is derived the way the
                    data layer documents it: total - subtotal - shipping.
                    Without this row the printed figures do not add up. */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{`GST (${Math.round(GST_RATE * 100)}%):`}</span>
                  <span className="text-white">
                    {formatPrice(
                      Math.max(0, order.totalAmount - order.subtotal - order.shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                  <span className="text-lg font-semibold text-[#daa520]">Total:</span>
                  <span className="text-lg font-bold text-[#daa520]">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-4">
                <h4 className="text-base font-semibold text-white mb-3">Shipping Address:</h4>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-white font-medium">{order.shippingAddress.fullName}</p>
                  <p className="text-gray-300">{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="text-gray-300">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-300">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-gray-300">{order.shippingAddress.country}</p>
                  <p className="text-gray-300">Phone: {order.shippingAddress.phone}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="text-base font-semibold text-white mb-3">Payment Method:</h4>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-white font-medium capitalize">
                    {order.paymentMethod.replace('_', ' ')}
                  </p>
                  {order.paymentMethod === 'upi' && order.upiId && (
                    <p className="text-gray-300 text-sm">UPI ID: {order.upiId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="bg-[#daa520] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#b38a1d]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
