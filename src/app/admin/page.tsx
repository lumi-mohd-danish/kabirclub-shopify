'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getCollections, getProducts } from '@/lib/supabase/api';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCollections: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsData, collectionsData] = await Promise.all([
          getProducts({ limit: 1000 }), // Get all products for count
          getCollections()
        ]);
        
        setStats({
          totalProducts: productsData.total || productsData.products.length,
          totalCollections: collectionsData.length,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Manage your KabirClub catalog from here
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Products</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {stats.loading ? '...' : stats.totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Collections</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                {stats.loading ? '...' : stats.totalCollections}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Revenue</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">₹0</p>
              <p className="text-xs text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-[#a855f7] rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-400">Orders</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">0</p>
              <p className="text-xs text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <a
            href="/admin/products/new"
            className="flex items-center p-3 sm:p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 bg-blue-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm sm:text-base">Add New Product</p>
              <p className="text-gray-400 text-xs sm:text-sm">Create a new product</p>
            </div>
          </a>

          <a
            href="/admin/catalog-upload"
            className="flex items-center p-3 sm:p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 bg-green-500 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm sm:text-base">Bulk Upload</p>
              <p className="text-gray-400 text-xs sm:text-sm">Upload catalog via CSV</p>
            </div>
          </a>

          <a
            href="/admin/collections/new"
            className="flex items-center p-3 sm:p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 bg-[#a855f7] rounded-lg mr-3 sm:mr-4 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm sm:text-base">New Collection</p>
              <p className="text-gray-400 text-xs sm:text-sm">Create a collection</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Recent Activity</h2>
        <div className="text-gray-400">
          <p className="text-sm sm:text-base">No recent activity to show.</p>
          <p className="text-xs sm:text-sm mt-2">Activity tracking will be available soon.</p>
        </div>
      </div>
    </div>
  );
}
