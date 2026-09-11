'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { PLATE, bannerClass, errorMessage } from '@/components/admin/admin-ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getCollections, getProducts } from '@/lib/supabase/api';
import { cn } from '@/lib/utils';

// One hairline grid: the tiles sit on an ink-700 ground with a 1px gap, so the
// dividers are the ground showing through rather than four separate borders.
const STAT_GRID =
  'grid grid-cols-2 gap-px border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4';
const STAT_TILE = 'bg-ink-800 p-3';
const STAT_ICON = 'h-4 w-4 shrink-0 text-paper-muted';
// A KPI, not a headline: `h2` at tool density rather than the storefront's
// display scale, which ran to 56px for a two-digit number.
const STAT_VALUE = 'num mt-2 font-display text-h2 text-paper';

// Quick actions are navigation plates, not calls to action: hairline, no fill,
// gold only in the icon stroke. The single filled gold element on this screen
// would be a primary CTA, and a dashboard does not have one.
const ACTION_TILE =
  'flex items-center gap-3 border border-ink-700 bg-ink-800 p-3 transition-colors duration-fast ease-cloth hover:border-ink-faint hover:bg-ink-700';

const ACTION_ICON = 'h-5 w-5 shrink-0 text-zari-500';

interface QuickAction {
  href: string;
  title: string;
  description: string;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/admin/products/new',
    title: 'Add new product',
    description: 'Create a single product',
    path: 'M12 4v16m8-8H4'
  },
  {
    href: '/admin/catalog-upload',
    title: 'Bulk upload',
    description: 'Import a CSV or JSON catalogue',
    path: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
  },
  {
    href: '/admin/collections/new',
    title: 'New collection',
    description: 'Group products under one handle',
    path: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
  }
];

interface StatTileProps {
  label: string;
  value: string;
  note?: string;
  path: string;
}

function StatTile({ label, value, note, path }: StatTileProps) {
  return (
    <div className={STAT_TILE}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-zari-500">{label}</p>
        <svg
          aria-hidden="true"
          className={STAT_ICON}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
        </svg>
      </div>
      <p className={STAT_VALUE}>{value}</p>
      {note ? <p className="mt-1 text-caption text-paper-muted">{note}</p> : null}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const [totals, setTotals] = useState({ products: 0, collections: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [productsData, collectionsData] = await Promise.all([
          // The count is what is wanted, not the rows: one item is enough to
          // read `total` off, and admin counts disabled products too.
          getProducts({ limit: 1, includeInactive: true }),
          getCollections()
        ]);

        if (cancelled) return;

        setTotals({
          products: productsData.total,
          collections: collectionsData.length
        });
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(errorMessage(error, 'Could not load the catalogue counts.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const count = (value: number) => (isLoading ? '—' : String(value));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Dashboard"
        title={user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
        description="Manage the KabirClub catalogue from here."
      />

      {loadError ? (
        <p role="status" aria-live="polite" className={bannerClass('error')}>
          {loadError}
        </p>
      ) : null}

      <div className={STAT_GRID}>
        <StatTile
          label="Products"
          value={count(totals.products)}
          note="Includes disabled"
          path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
        />
        <StatTile
          label="Collections"
          value={count(totals.collections)}
          path="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
        <StatTile
          label="Revenue"
          value="₹0"
          note="Coming soon"
          path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
        />
        <StatTile
          label="Orders"
          value="0"
          note="Coming soon"
          path="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </div>

      <section>
        <h2 className="eyebrow text-paper-muted">Quick actions</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className={ACTION_TILE}>
              <svg
                aria-hidden="true"
                className={ACTION_ICON}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={action.path}
                />
              </svg>
              <span className="min-w-0">
                <span className="block text-body-sm font-medium text-paper">{action.title}</span>
                <span className="block text-caption text-paper-muted">{action.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-paper-muted">Recent activity</h2>
        <div className={cn(PLATE, 'mt-2 p-3')}>
          <p className="text-caption text-paper-muted">
            No recent activity to show. Activity tracking is not built yet.
          </p>
        </div>
      </section>
    </div>
  );
}
