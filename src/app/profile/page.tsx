'use client';

import { useAuth } from '@/hooks/useAuth';
import { getCartSessionId } from '@/components/cart/actions';
import { getOrders } from '@/lib/supabase/api';
import { Order } from '@/lib/supabase/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Force dynamic rendering to avoid localStorage issues
export const dynamic = 'force-dynamic';

/** Order status -> a state token. Chips are `.eyebrow` on a 3px control radius:
 *  neem = delivered, haldi = awaiting action, ink = in transit, madder = failed.
 *  There is no blue/purple in the palette, so "in transit" reads as strong
 *  neutral ink rather than as an off-system hue. */
const getStatusChipClass = (status: string): string => {
  switch (status) {
    case 'delivered':
      return 'bg-neem text-paper';
    case 'shipped':
      return 'bg-ink-900 text-paper';
    case 'confirmed':
      return 'bg-haldi text-ink';
    default:
      return 'border border-line-strong bg-paper-sunk text-ink-muted';
  }
};

export default function ProfilePage() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  // Update editForm when user changes
  useEffect(() => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
  }, [user]);

  const fetchOrders = useCallback(async () => {
    try {
      const sessionId = await getSessionId();
      if (sessionId) {
        const ordersData = await getOrders(sessionId);
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

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

    // User is authenticated, fetch orders
    fetchOrders();
  }, [authLoading, isAuthenticated, user, router, fetchOrders]);

  // The cart session cookie is httpOnly, so `document.cookie` cannot see it.
  const getSessionId = (): Promise<string | null> => getCartSessionId();

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically update the user profile
    // For now, we'll just close the edit mode
    setIsEditing(false);
    // You can add API call to update user profile
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-pill border-b-2 border-zari-700"></div>
          <p className="text-lead text-ink-muted">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (!isAuthenticated() || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
        <div className="text-center">
          <p className="eyebrow text-ink-muted">Account</p>
          <h1 className="mt-3 font-display text-h2 text-ink">Authentication required</h1>
          <p className="mt-3 text-body text-ink-muted">Please log in to view your profile</p>
          <button onClick={() => router.push('/login')} className="btn-primary mt-8">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-16 text-ink md:py-24">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="eyebrow text-ink-muted">Account</p>
          <div className="rule-zari mx-auto mt-4 w-16" />
          <h1 className="mt-5 font-display text-h1 text-ink">My Profile</h1>
          <p className="mt-3 text-body text-ink-muted">
            Manage your account and view your information
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
          <span className="text-ink">My Profile</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="rounded-plate border border-line bg-paper-raised p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-display text-h2 text-ink">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`${isEditing ? 'btn-secondary' : 'btn-primary'} shrink-0 px-5 py-2.5 text-body-sm`}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="mb-2 block text-body-sm font-medium text-ink"
                    >
                      Full Name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="field"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-email"
                      className="mb-2 block text-body-sm font-medium text-ink"
                    >
                      Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="field"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-phone"
                      className="mb-2 block text-body-sm font-medium text-ink"
                    >
                      Phone
                    </label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="field num"
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10,15}"
                      title="Please enter a valid phone number (10-15 digits)"
                    />
                    <p className="mt-2 text-body-sm text-ink-muted">
                      Optional: Enter your phone number for better communication
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-5">
                  <div>
                    <dt className="eyebrow text-ink-muted">Full Name</dt>
                    <dd className="mt-1 text-lead text-ink">{user?.name || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-muted">Email</dt>
                    <dd className="mt-1 text-lead text-ink">{user?.email || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-muted">Phone</dt>
                    <dd className="num mt-1 text-lead text-ink">{user?.phone || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-muted">Member Since</dt>
                    <dd className="num mt-1 text-lead text-ink">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Not available'}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 rounded-plate border border-line bg-paper-raised p-6 md:p-8">
              <p className="eyebrow text-ink-muted">Shortcuts</p>
              <h3 className="mb-5 mt-2 text-h3 text-ink">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link
                  href="/orders"
                  className="group flex items-center gap-4 rounded-plate border border-line bg-paper p-5 transition-shadow duration-fast ease-cloth hover:shadow-card"
                >
                  <svg
                    className="h-6 w-6 shrink-0 text-zari-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>
                    <span className="block text-body font-medium text-ink transition-colors duration-fast ease-cloth group-hover:text-zari-700">
                      View Orders
                    </span>
                    <span className="mt-1 block text-body-sm text-ink-muted">
                      Check your order history
                    </span>
                  </span>
                </Link>

                <Link
                  href="/"
                  className="group flex items-center gap-4 rounded-plate border border-line bg-paper p-5 transition-shadow duration-fast ease-cloth hover:shadow-card"
                >
                  <svg
                    className="h-6 w-6 shrink-0 text-zari-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span>
                    <span className="block text-body font-medium text-ink transition-colors duration-fast ease-cloth group-hover:text-zari-700">
                      Continue Shopping
                    </span>
                    <span className="mt-1 block text-body-sm text-ink-muted">
                      Browse our products
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Avatar */}
            <div className="rounded-plate border border-line bg-paper-raised p-6 text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-pill bg-ink-900">
                <span className="font-display text-h1 text-zari-300">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <h3 className="text-h3 text-ink">{user?.name || 'User'}</h3>
              <p className="mt-1 break-words text-body-sm text-ink-muted">{user?.email}</p>
            </div>

            {/* Account Stats */}
            <div className="rounded-plate border border-line bg-paper-raised p-6">
              <p className="eyebrow text-ink-muted">Overview</p>
              <h3 className="mb-4 mt-2 text-h3 text-ink">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-body text-ink-muted">Total Orders</span>
                  <span className="num text-body font-medium text-ink">{orders.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-body text-ink-muted">Member Since</span>
                  <span className="num text-body font-medium text-ink">
                    {user?.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="rounded-plate border border-line bg-paper-raised p-6">
              <p className="eyebrow text-ink-muted">Session</p>
              <h3 className="mb-4 mt-2 text-h3 text-ink">Account Actions</h3>
              <button
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-control border border-madder bg-transparent px-8 py-4 text-body font-medium leading-none text-madder transition-colors duration-fast ease-cloth hover:bg-madder hover:text-paper active:translate-y-px"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders Preview */}
        {orders.length > 0 && (
          <div className="mt-6 rounded-plate border border-line bg-paper-raised p-6 md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-ink-muted">History</p>
                <h3 className="mt-2 text-h3 text-ink">Recent Orders</h3>
              </div>
              <Link href="/orders" className="thread-link text-body font-medium text-zari-700">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 rounded-plate border border-line bg-paper p-4"
                >
                  <div>
                    <p className="num text-body font-medium text-ink">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="num mt-1 text-body-sm text-ink-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-price text-zari-700">&#8377;{order.totalAmount}</p>
                    <span
                      className={`eyebrow mt-2 inline-block rounded-control px-2.5 py-1 ${getStatusChipClass(order.orderStatus)}`}
                    >
                      {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
