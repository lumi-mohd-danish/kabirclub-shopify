'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getCollections, getProducts } from '@/lib/supabase/api';
import { useEffect, useState } from 'react';

// One hairline grid: the tiles sit on an ink-700 ground with a 1px gap, so the
// dividers are the ground showing through rather than four separate borders.
const STAT_GRID =
  'grid grid-cols-1 gap-px border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4';
const STAT_TILE = 'bg-ink-800 p-4';
const STAT_ICON = 'h-5 w-5 flex-shrink-0 text-paper-muted';
const STAT_VALUE = 'num mt-3 font-display text-display-2 text-paper';

// Quick actions are navigation plates, not calls to action: hairline, no fill,
// gold only in the icon stroke. The single filled gold element on this screen
// would be a primary CTA, and a dashboard does not have one.
const ACTION_TILE =
  'flex items-center gap-3 border border-ink-700 bg-ink-800 p-4 transition-colors duration-fast ease-cloth hover:border-ink-faint hover:bg-ink-700';

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <p className="eyebrow text-zari-500">Dashboard</p>
        <h1 className="mt-2 font-display text-h2 text-paper">
          Welcome back, {user?.name}!
        </h1>
        <div className="rule-zari mt-3 w-12" />
        <p className="mt-3 text-body-sm text-paper-muted">
          Manage your KabirClub catalog from here
        </p>
      </div>

      {/* Stats Cards */}
      <div className={STAT_GRID}>
        <div className={STAT_TILE}>
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-zari-500">Total Products</p>
            <svg aria-hidden="true" className={STAT_ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <p className={STAT_VALUE}>
            {stats.loading ? '...' : stats.totalProducts}
          </p>
        </div>

        <div className={STAT_TILE}>
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-zari-500">Collections</p>
            <svg aria-hidden="true" className={STAT_ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className={STAT_VALUE}>
            {stats.loading ? '...' : stats.totalCollections}
          </p>
        </div>

        <div className={STAT_TILE}>
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-zari-500">Revenue</p>
            <svg aria-hidden="true" className={STAT_ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className={STAT_VALUE}>₹0</p>
          <p className="mt-2 text-caption text-paper-muted">Coming soon</p>
        </div>

        <div className={STAT_TILE}>
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow text-zari-500">Orders</p>
            <svg aria-hidden="true" className={STAT_ICON} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className={STAT_VALUE}>0</p>
          <p className="mt-2 text-caption text-paper-muted">Coming soon</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="eyebrow text-paper-muted">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/admin/products/new" className={ACTION_TILE}>
            <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-zari-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-paper">Add New Product</p>
              <p className="text-caption text-paper-muted">Create a new product</p>
            </div>
          </a>

          <a href="/admin/catalog-upload" className={ACTION_TILE}>
            <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-zari-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-paper">Bulk Upload</p>
              <p className="text-caption text-paper-muted">Upload catalog via CSV</p>
            </div>
          </a>

          <a href="/admin/collections/new" className={ACTION_TILE}>
            <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-zari-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-paper">New Collection</p>
              <p className="text-caption text-paper-muted">Create a collection</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="eyebrow text-paper-muted">Recent Activity</h2>
        <div className="mt-3 border border-ink-700 bg-ink-800 p-4">
          <p className="text-body-sm text-paper-muted">No recent activity to show.</p>
          <p className="mt-2 text-caption text-paper-muted">Activity tracking will be available soon.</p>
        </div>
      </div>
    </div>
  );
}
