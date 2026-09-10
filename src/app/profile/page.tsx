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
    setEditForm(prev => ({
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#daa520] mx-auto mb-4"></div>
          <p className="text-lg">Loading your profile...</p>
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
          <p className="text-gray-400 mb-6">Please log in to view your profile</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-[#daa520] hover:bg-[#b38a1d] text-black font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#daa520]">My Profile</h1>
          <p className="text-gray-400 mt-2">Manage your account and view your information</p>
        </div>

        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-center mb-6 text-sm text-gray-400">
          <Link href="/" className="hover:text-[#daa520] transition-colors duration-200">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#daa520]">My Profile</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-[#daa520] text-black rounded-lg font-semibold hover:bg-[#b38a1d] transition-colors duration-200"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#daa520]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#daa520]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#daa520]"
                      placeholder="Enter your phone number"
                      pattern="[0-9]{10,15}"
                      title="Please enter a valid phone number (10-15 digits)"
                    />
                    <p className="text-xs text-gray-400 mt-1">Optional: Enter your phone number for better communication</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#daa520] text-black rounded-lg font-semibold hover:bg-[#b38a1d] transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                    <p className="text-white text-lg">{user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <p className="text-white text-lg">{user?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                    <p className="text-white text-lg">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Member Since</label>
                    <p className="text-white text-lg">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Not available'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/orders"
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-[#daa520] transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#daa520] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold group-hover:text-[#daa520] transition-colors duration-200">
                        View Orders
                      </h4>
                      <p className="text-gray-400 text-sm">Check your order history</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/"
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-[#daa520] transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#daa520] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold group-hover:text-[#daa520] transition-colors duration-200">
                        Continue Shopping
                      </h4>
                      <p className="text-gray-400 text-sm">Browse our products</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Avatar */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
              <div className="w-24 h-24 bg-[#daa520] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-black">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{user?.name || 'User'}</h3>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>

            {/* Account Stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Orders</span>
                  <span className="text-white font-semibold">{orders.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white font-semibold">
                    {user?.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Account Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Preview */}
        {orders.length > 0 && (
          <div className="mt-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Recent Orders</h3>
                <Link
                  href="/orders"
                  className="text-[#daa520] hover:text-[#b38a1d] font-semibold transition-colors duration-200"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#daa520] font-bold">₹{order.totalAmount}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.orderStatus === 'delivered' ? 'bg-green-600 text-green-100' :
                        order.orderStatus === 'shipped' ? 'bg-blue-600 text-blue-100' :
                        order.orderStatus === 'confirmed' ? 'bg-yellow-600 text-yellow-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
