'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Admin chrome is an ink band, like the storefront header and footer, but at
// tool density: the nav is one 11px eyebrow row rather than an editorial bar.
// The gold thread is drawn on hover and focus-visible alike by `.thread-link-ink`.
const NAV_LINK =
  'thread-link-ink eyebrow whitespace-nowrap py-2 text-paper-muted hover:text-paper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated()) {
        router.push('/login?redirect=/admin');
        return;
      }
      if (!isAdmin()) {
        router.push('/');
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-5">
        <div className="text-h3 text-paper-muted">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-5">
        <div className="text-center text-h3 text-paper">Access Denied</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900 text-paper">
      {/* Admin Navigation */}
      <nav className="border-b border-ink-700 bg-ink-900">
        <div className="container-page flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <Link href="/" className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-display text-h3 text-paper">KabirClub</span>
              <span className="eyebrow text-zari-500">Admin</span>
            </Link>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <Link href="/admin" className={NAV_LINK}>
                Dashboard
              </Link>
              <Link href="/admin/products" className={NAV_LINK}>
                Products
              </Link>
              <Link href="/admin/collections" className={NAV_LINK}>
                Collections
              </Link>
              <Link href="/admin/catalog-upload" className={NAV_LINK}>
                Catalog Upload
              </Link>
            </div>
          </div>
          <Link href="/" className={`${NAV_LINK} self-start sm:self-auto`}>
            Back to Store
          </Link>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="container-page py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
